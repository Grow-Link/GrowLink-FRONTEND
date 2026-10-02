import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate as useRouterNavigate, useLocation, matchPath } from 'react-router-dom';
import { getSession, SESSION_EXPIRED_EVENT, type BackendSession } from '../services/backendSession';
import { login as loginBackend, logout as logoutBackend, rolDesdeBackend, type UsuarioQuemado } from '../services/usuariosServiceApi';
import type { Page, SeedUser, UserRole } from '../types';

const PAGE_PATHS: Record<Page, string> = {
  landing: '/',
  'select-user': '/ingresar',
  home: '/inicio',
  onboarding: '/perfil/completar',
  roadmap: '/roadmap',
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
  { page: 'home', pattern: '/inicio' },
  { page: 'onboarding', pattern: '/perfil/completar' },
  { page: 'roadmap', pattern: '/roadmap' },
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

const ROLE_HOME: Record<UserRole, Page> = {
  user: 'home',
  publisher: 'my-courses',
  admin: 'admin-dashboard',
};

const ROLE_ALLOWED: Record<UserRole, Page[]> = {
  user: ['home', 'onboarding', 'roadmap', 'catalog', 'course-detail', 'completed-courses', 'trivia', 'account-settings', 'public-profile', 'subscription'],
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
  navigate: (page: Page, data?: { id?: string }) => void;
  goBack: () => void;
  canGoBack: boolean;
  login: (usuario: UsuarioQuemado) => Promise<void>;
  logout: () => void;
  /** true cuando la sesión se cerró porque un backend rechazó el token (no por un logout manual). */
  sessionExpired: boolean;
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

  const currentUser = userFromSession(session);
  const currentPage = resolvePage(location.pathname);
  const paramId = resolveParamId(location.pathname);

  useEffect(() => {
    if (!currentUser) {
      if (currentPage !== 'select-user' && currentPage !== 'landing') {
        routerNavigate(PAGE_PATHS['select-user'], { replace: true });
      }
      return;
    }
    if (currentPage === 'select-user' || currentPage === 'landing' || !ROLE_ALLOWED[currentUser.role].includes(currentPage)) {
      routerNavigate(PAGE_PATHS[ROLE_HOME[currentUser.role]], { replace: true });
    }
  }, [location.pathname, currentPage, currentUser, routerNavigate]);

  async function login(usuario: UsuarioQuemado) {
    const newSession = await loginBackend(usuario);
    setSessionState(newSession);
    setSessionExpired(false);
    routerNavigate(PAGE_PATHS[ROLE_HOME[rolDesdeBackend(newSession.rol)]], { replace: true });
  }

  function logout() {
    logoutBackend();
    setSessionState(null);
    setSessionExpired(false);
    routerNavigate(PAGE_PATHS['select-user'], { replace: true });
  }

  function navigate(page: Page, data?: { id?: string }) {
    let path = PAGE_PATHS[page];
    if (page === 'course-detail' && data?.id) {
      path = `${PAGE_PATHS['course-detail']}/${data.id}`;
    } else if (page === 'publish-course' && data?.id) {
      path = `/mis-cursos/${data.id}/editar`;
    }
    setNavCount((c) => c + 1);
    routerNavigate(path);
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
