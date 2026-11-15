// A que pantalla manda NavigationContext a cada persona: es la logica que decide la sesion y la ruta segun el rol
// (por eso cuenta para la cobertura, ver vitest.config.ts). Se prueba con un componente de apoyo que deja a la vista
// lo que expone el contexto y con un MemoryRouter, sin pantallas reales y sin red (los servicios estan simulados).

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation, type InitialEntry } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationProvider, useNavigation } from './NavigationContext';
import type { BackendSession } from '../services/backendSession';

const servicios = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  elegirRol: vi.fn(),
  guardarSesionDe: vi.fn(),
}));

vi.mock('../services/usuariosServiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/usuariosServiceApi')>()),
  login: servicios.login,
  logout: servicios.logout,
  elegirRol: servicios.elegirRol,
  guardarSesionDe: servicios.guardarSesionDe,
}));

type Contexto = ReturnType<typeof useNavigation>;

const vista: { ctx: Contexto | null; ruta: string } = { ctx: null, ruta: '' };

function Apoyo() {
  vista.ctx = useNavigation();
  vista.ruta = useLocation().pathname;
  return null;
}

function sesion(rol: string): BackendSession {
  return { token: 't', usuarioId: 7, nombre: 'Ana', rol };
}

let raiz: Root;

async function montar(entrada: InitialEntry, hijos: ReactNode = <Apoyo />) {
  const contenedor = document.createElement('div');
  raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(
      <MemoryRouter initialEntries={[entrada]}>
        <NavigationProvider>{hijos}</NavigationProvider>
      </MemoryRouter>,
    );
  });
}

function guardar(rol: string) {
  sessionStorage.setItem('gl_backend_session', JSON.stringify(sesion(rol)));
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vista.ctx = null;
  vista.ruta = '';
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(async () => {
  await act(async () => raiz.unmount());
});

describe('NavigationContext', () => {
  it('sin sesion, una pantalla privada manda al ingreso', async () => {
    await montar('/inicio');
    expect(vista.ruta).toBe('/ingresar');
    expect(vista.ctx?.currentUser).toBeNull();
  });

  it('sin sesion, la portada y el ingreso se quedan donde estan', async () => {
    await montar('/');
    expect(vista.ruta).toBe('/');
  });

  it('con sesion, el inicio de cada rol es su pantalla de entrada', async () => {
    guardar('USUARIO');
    await montar('/ingresar');
    expect(vista.ruta).toBe('/inicio');
    expect(vista.ctx?.currentUser?.name).toBe('Ana');
  });

  it('con sesion, la pantalla de elegir rol ya no se usa', async () => {
    guardar('PUBLICADOR');
    await montar('/elegir-rol');
    expect(vista.ruta).toBe('/mis-cursos');
  });

  it('una pantalla que el rol no puede ver lo devuelve a su inicio', async () => {
    guardar('USUARIO');
    await montar('/admin/metricas');
    expect(vista.ruta).toBe('/inicio');
  });

  it('una entrada del historial de otra sesion se reemplaza por el inicio', async () => {
    guardar('USUARIO');
    sessionStorage.setItem('gl_nav_marca', 'mia');
    await montar({ pathname: '/cursos', state: { marca: 'ajena' } });
    expect(vista.ruta).toBe('/inicio');
  });

  it('navigate lleva a la pantalla pedida, con el id en las de detalle y edicion', async () => {
    guardar('PUBLICADOR');
    await montar('/mis-cursos');
    await act(async () => vista.ctx?.navigate('course-detail', { id: '12' }));
    expect(vista.ruta).toBe('/cursos/detalle/12');
    expect(vista.ctx?.paramId).toBe('12');
    expect(vista.ctx?.canGoBack).toBe(true);
    await act(async () => vista.ctx?.navigate('publish-course', { id: '5' }));
    expect(vista.ruta).toBe('/mis-cursos/5/editar');
    expect(vista.ctx?.paramId).toBe('5');
    await act(async () => vista.ctx?.navigate('catalog', { replace: true }));
    expect(vista.ruta).toBe('/cursos');
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('goBack vuelve a la pantalla anterior', async () => {
    guardar('PUBLICADOR');
    await montar('/mis-cursos');
    await act(async () => vista.ctx?.navigate('catalog'));
    expect(vista.ruta).toBe('/cursos');
    await act(async () => vista.ctx?.goBack());
    expect(vista.ruta).toBe('/mis-cursos');
  });

  it('login deja la sesion activa y entra al inicio del rol', async () => {
    servicios.login.mockResolvedValue(sesion('ADMIN'));
    await montar('/ingresar');
    await act(async () => vista.ctx?.login({ id: 7 } as never));
    expect(vista.ruta).toBe('/admin/metricas');
    expect(vista.ctx?.currentUser?.role).toBe('admin');
    expect(sessionStorage.getItem('gl_nav_marca')).toMatch(/^7-/);
  });

  it('logout borra la marca y regresa al ingreso', async () => {
    servicios.logout.mockResolvedValue(undefined);
    guardar('USUARIO');
    sessionStorage.setItem('gl_nav_marca', 'mia');
    await montar('/inicio');
    await act(async () => vista.ctx?.logout());
    expect(vista.ruta).toBe('/ingresar');
    expect(vista.ctx?.currentUser).toBeNull();
    expect(sessionStorage.getItem('gl_nav_marca')).toBeNull();
    expect(servicios.logout).toHaveBeenCalled();
  });

  it('confirmarRol guarda la sesion con el rol elegido y entra a su inicio', async () => {
    servicios.elegirRol.mockResolvedValue({ id: 7 });
    servicios.guardarSesionDe.mockImplementation(() => {
      const nueva = sesion('PUBLICADOR');
      sessionStorage.setItem('gl_backend_session', JSON.stringify(nueva));
      return nueva;
    });
    guardar('USUARIO');
    await montar('/inicio');
    await act(async () => vista.ctx?.confirmarRol('PUBLICADOR'));
    expect(servicios.elegirRol).toHaveBeenCalledWith('PUBLICADOR');
    expect(vista.ruta).toBe('/mis-cursos');
  });

  it('cuando un servicio rechaza el token la sesion se cierra y se avisa', async () => {
    guardar('USUARIO');
    await montar('/inicio');
    await act(async () => {
      window.dispatchEvent(new Event('gl:session-expired'));
    });
    expect(vista.ctx?.sessionExpired).toBe(true);
    expect(vista.ctx?.currentUser).toBeNull();
    expect(vista.ruta).toBe('/ingresar');
  });

  it('useNavigation fuera del proveedor avisa del error', () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const contenedor = document.createElement('div');
    const aparte = createRoot(contenedor);
    expect(() => act(() => aparte.render(<Apoyo />))).toThrow('useNavigation must be used within NavigationProvider');
    consola.mockRestore();
    raiz = createRoot(document.createElement('div'));
  });
});
