import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate as useRouterNavigate, useLocation, matchPath } from 'react-router-dom';
import { clearSession, getSession, SESSION_EXPIRED_EVENT, type BackendSession } from '../services/backendSession';
import {
  elegirRol,
  guardarSesionDe,
  iniciarSesionConToken,
  login as loginBackend,
  logout as logoutBackend,
  rolDesdeBackend,
  type RolElegible,
  type UsuarioQuemado,
} from '../services/usuariosServiceApi';
import { esOidc } from '../services/authMode';
import { cuentaActiva, iniciarSesionConMicrosoft } from '../services/msalAuth';
import type { Page, SeedUser, UserRole } from '../types';

const PAGE_PATHS: Record<Page, string> = {
  landing: '/',
  'select-user': '/ingresar',
  'role-choice': '/elegir-rol',
  home: '/inicio',
  onboarding: '/perfil/completar',
  roadmap: '/roadmap',
  garden: '/jardin',
  catalog: '/cursos',
  'course-detail': '/cursos/detalle',
  'my-courses': '/mis-cursos',
  'publish-course': '/mis-cursos/publicar',
  'completed-courses': '/completados',
  trivia: '/trivia',
  'trivia-questions': '/trivia/preguntas',
  'admin-dashboard': '/admin/metricas',
  'admin-courses': '/admin/cursos',
  'account-settings': '/cuenta',
  'public-profile': '/perfil',
  subscription: '/suscripcion',
};

const ROUTE_PATTERNS: { page: Page; pattern: string }[] = [
  { page: 'landing', pattern: '/' },
  { page: 'course-detail', pattern: '/cursos/detalle/:id' },
  { page: 'publish-course', pattern: '/mis-cursos/:id/editar' },
  { page: 'publish-course', pattern: '/mis-cursos/publicar' },
  { page: 'select-user', pattern: '/ingresar' },
  { page: 'role-choice', pattern: '/elegir-rol' },
  { page: 'home', pattern: '/inicio' },
  { page: 'onboarding', pattern: '/perfil/completar' },
  { page: 'roadmap', pattern: '/roadmap' },
  { page: 'garden', pattern: '/jardin' },
  { page: 'catalog', pattern: '/cursos' },
  { page: 'my-courses', pattern: '/mis-cursos' },
  { page: 'completed-courses', pattern: '/completados' },
  { page: 'trivia-questions', pattern: '/trivia/preguntas' },
  { page: 'trivia', pattern: '/trivia' },
  { page: 'admin-dashboard', pattern: '/admin/metricas' },
  { page: 'admin-courses', pattern: '/admin/cursos' },
  { page: 'account-settings', pattern: '/cuenta' },
  { page: 'public-profile', pattern: '/perfil' },
  { page: 'subscription', pattern: '/suscripcion' },
];

const MARCA_STORAGE = 'gl_nav_marca';

const ROLE_HOME: Record<UserRole, Page> = {
  user: 'home',
  publisher: 'my-courses',
  admin: 'admin-dashboard',
};

const ROLE_ALLOWED: Record<UserRole, Page[]> = {
  user: ['home', 'onboarding', 'roadmap', 'garden', 'catalog', 'course-detail', 'completed-courses', 'trivia', 'account-settings', 'public-profile', 'subscription'],
  publisher: ['my-courses', 'publish-course', 'catalog', 'course-detail', 'trivia', 'trivia-questions', 'account-settings', 'public-profile'],
  admin: ['admin-dashboard', 'admin-courses', 'catalog', 'course-detail', 'account-settings', 'public-profile'],
};

function resolvePage(pathname: string): Page {
  for (const { page, pattern } of ROUTE_PATTERNS) {
    if (matchPath(pattern, pathname)) return page;
  }
  return 'select-user';
}

function resolveParamId(pathname: string): string | null {
  const course = matchPath('/cursos/detalle/:id', pathname);
  if (course?.params.id) return course.params.id;
  const edit = matchPath('/mis-cursos/:id/editar', pathname);
  if (edit?.params.id) return edit.params.id;
  return null;
}

interface NavigationContextValue {
  currentPage: Page;
  currentUser: SeedUser | null;
  paramId: string | null;
  /** `replace: true` reemplaza la entrada actual del historial (para que «atrás» no vuelva a un formulario ya enviado). */
  navigate: (page: Page, data?: { id?: string; replace?: boolean }) => void;
  goBack: () => void;
  canGoBack: boolean;
  login: (usuario: UsuarioQuemado) => Promise<void>;
  logout: () => void;
  /** true cuando la sesión se cerró porque un backend rechazó el token (no por un logout manual). */
  sessionExpired: boolean;
  /** Modo oidc: abre el inicio de sesión con Microsoft y deja la sesión lista (ver msalAuth). */
  loginConMicrosoft: () => Promise<void>;
  /** Modo oidc: todavía se está resolviendo quién es la persona (al cargar, o volviendo del login). */
  resolviendoSesion: boolean;
  /** Modo oidc: /api/usuarios/me dijo que la persona aún no ha escogido su rol. */
  necesitaElegirRol: boolean;
  /** PUT /api/usuarios/me/rol; si falla, el error sube para que la pantalla lo muestre y deje reintentar. */
  confirmarRol: (rol: RolElegible) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function userFromSession(session: BackendSession | null): SeedUser | null {
  if (!session) return null;
  return {
    id: String(session.usuarioId),
    name: session.nombre,
    role: rolDesdeBackend(session.rol),
    headline: session.cargo ?? '',
    org: session.cargo,
  };
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useRouterNavigate();
  const location = useLocation();
  const [navCount, setNavCount] = useState(0);
  const [session, setSessionState] = useState<BackendSession | null>(() => getSession());
  const [sessionExpired, setSessionExpired] = useState(false);
  const [necesitaElegirRol, setNecesitaElegirRol] = useState(false);
  // En modo oidc la sesión no se sabe de entrada: hay que preguntarle a MSAL si hay cuenta y, si la hay,
  // a /api/usuarios/me quién es. Mientras eso corre no se decide ninguna redirección (si no, se vería
  // pasar la pantalla de ingreso antes de entrar). En modo legacy nunca hay nada que resolver.
  const [resolviendoSesion, setResolviendoSesion] = useState(() => esOidc() && !getSession());

  // Cualquier llamada autenticada que responda 401/403 dispara esto (ver
  // backendSession.ts) — el token ya no es válido, así que se cierra la sesión.
  useEffect(() => {
    const onExpired = () => {
      setSessionState(null);
      setSessionExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Cada inicio de sesión tiene su propia "marca", y cada página que se abre dentro de la app la lleva en el
  // historial del navegador. Así, si alguien entra con otro usuario, el botón «atrás» del navegador no lo lleva
  // a pantallas que vio la sesión anterior (por ejemplo, la trivia de otra persona): esas entradas llevan otra
  // marca y se reemplazan por el inicio de su rol.
  const [marca, setMarca] = useState<string>(() => sessionStorage.getItem(MARCA_STORAGE) ?? '');

  function nuevaMarca(usuarioId: number) {
    const valor = `${usuarioId}-${Date.now()}`;
    sessionStorage.setItem(MARCA_STORAGE, valor);
    setMarca(valor);
    return valor;
  }

  /** Resuelve la sesión a partir del token de Microsoft (GET /api/usuarios/me) y la deja activa. */
  async function adoptarSesionDeMicrosoft(): Promise<{ session: BackendSession; rolElegido: boolean }> {
    const resuelta = await iniciarSesionConToken();
    nuevaMarca(resuelta.session.usuarioId);
    setSessionState(resuelta.session);
    setSessionExpired(false);
    setNecesitaElegirRol(!resuelta.rolElegido);
    setNavCount(0);
    return resuelta;
  }

  // Modo oidc: al cargar la app (y al volver del login por redirección) se mira si MSAL ya tiene una cuenta
  // con sesión abierta. Si la tiene, se le pregunta a usuarios-service quién es — eso también revisa si ya
  // escogió su rol, así que un reload no se salta esa pantalla.
  useEffect(() => {
    if (!esOidc()) return;
    let ignorar = false;
    (async () => {
      try {
        const cuenta = await cuentaActiva();
        if (ignorar) return;
        // sin cuenta de Microsoft no hay sesión posible: si quedó una guardada (se limpió la caché de MSAL,
        // por ejemplo) se descarta ya, en vez de esperar a que falle la primera llamada
        if (!cuenta) {
          clearSession();
          setSessionState(null);
          return;
        }
        await adoptarSesionDeMicrosoft();
      } catch {
        // sin sesión válida se queda en la pantalla de ingreso, que es la que muestra el error al reintentar
        if (!ignorar) setSessionState(null);
      } finally {
        if (!ignorar) setResolviendoSesion(false);
      }
    })();
    return () => {
      ignorar = true;
    };
    // solo al montar: es el arranque de la app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentUser = userFromSession(session);
  const currentPage = resolvePage(location.pathname);
  const paramId = resolveParamId(location.pathname);
  const marcaDeLaEntrada = (location.state as { marca?: string } | null)?.marca;

  useEffect(() => {
    // en modo oidc todavía no se sabe si hay sesión: cualquier redirección ahora sería a ciegas
    if (resolviendoSesion) return;
    if (!currentUser) {
      if (currentPage !== 'select-user' && currentPage !== 'landing') {
        routerNavigate(PAGE_PATHS['select-user'], { replace: true });
      }
      return;
    }
    // primer ingreso con Microsoft: hasta que escoja su rol no puede ir a ninguna otra parte
    if (necesitaElegirRol) {
      if (currentPage !== 'role-choice') {
        routerNavigate(PAGE_PATHS['role-choice'], { replace: true, state: { marca } });
      }
      return;
    }
    const inicio = PAGE_PATHS[ROLE_HOME[currentUser.role]];
    if (currentPage === 'role-choice') {
      routerNavigate(inicio, { replace: true, state: { marca } });
      return;
    }
    if (currentPage === 'select-user' || currentPage === 'landing' || !ROLE_ALLOWED[currentUser.role].includes(currentPage)) {
      routerNavigate(inicio, { replace: true, state: { marca } });
      return;
    }
    // una entrada del historial de otra sesión: se manda al inicio en vez de mostrar pantallas ajenas
    if (marca && marcaDeLaEntrada !== undefined && marcaDeLaEntrada !== marca && location.pathname !== inicio) {
      routerNavigate(inicio, { replace: true, state: { marca } });
    }
  }, [location.pathname, currentPage, currentUser, routerNavigate, marca, marcaDeLaEntrada, resolviendoSesion, necesitaElegirRol]);

  async function login(usuario: UsuarioQuemado) {
    const newSession = await loginBackend(usuario);
    const valor = nuevaMarca(newSession.usuarioId);
    setSessionState(newSession);
    setSessionExpired(false);
    setNavCount(0);
    routerNavigate(PAGE_PATHS[ROLE_HOME[rolDesdeBackend(newSession.rol)]], { replace: true, state: { marca: valor } });
  }

  /**
   * Modo oidc: abre el inicio de sesión con Microsoft y, con el token, resuelve quién es la persona.
   * Si el navegador bloqueó la ventana emergente MSAL se va por redirección y no devuelve cuenta: la página
   * se recarga y el efecto de arranque termina el trabajo.
   */
  async function loginConMicrosoft() {
    const cuenta = await iniciarSesionConMicrosoft();
    if (!cuenta) return;
    const { session: nueva, rolElegido } = await adoptarSesionDeMicrosoft();
    const destino = rolElegido ? PAGE_PATHS[ROLE_HOME[rolDesdeBackend(nueva.rol)]] : PAGE_PATHS['role-choice'];
    routerNavigate(destino, { replace: true, state: { marca: sessionStorage.getItem(MARCA_STORAGE) ?? '' } });
  }

  async function confirmarRol(rol: RolElegible) {
    const me = await elegirRol(rol);
    const actualizada = guardarSesionDe(me);
    setSessionState(actualizada);
    setNecesitaElegirRol(false);
    routerNavigate(PAGE_PATHS[ROLE_HOME[rolDesdeBackend(actualizada.rol)]], { replace: true, state: { marca } });
  }

  function logout() {
    void logoutBackend();
    sessionStorage.removeItem(MARCA_STORAGE);
    setMarca('');
    setSessionState(null);
    setSessionExpired(false);
    setNecesitaElegirRol(false);
    setNavCount(0);
    routerNavigate(PAGE_PATHS['select-user'], { replace: true });
  }

  function navigate(page: Page, data?: { id?: string; replace?: boolean }) {
    let path = PAGE_PATHS[page];
    if (page === 'course-detail' && data?.id) {
      path = `${PAGE_PATHS['course-detail']}/${data.id}`;
    } else if (page === 'publish-course' && data?.id) {
      path = `/mis-cursos/${data.id}/editar`;
    }
    if (!data?.replace) setNavCount((c) => c + 1);
    routerNavigate(path, { replace: data?.replace ?? false, state: { marca } });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function goBack() {
    routerNavigate(-1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        currentUser,
        paramId,
        navigate,
        goBack,
        canGoBack: navCount > 0,
        login,
        logout,
        sessionExpired,
        loginConMicrosoft,
        resolviendoSesion,
        necesitaElegirRol,
        confirmarRol,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
