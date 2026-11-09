// Interruptor entre las dos formas de iniciar sesión que admite el front. Se elige con VITE_AUTH_MODE:
//
//   legacy (por defecto): el login de siempre — se elige una persona de /api/auth/usuarios y
//                         usuarios-service emite el JWT que se guarda en la sesión.
//   oidc:                 inicio de sesión con Microsoft (Authorization Code + PKCE, ver msalAuth.ts);
//                         el access token lo administra MSAL y el rol se escoge en el primer ingreso.
//
// El valor se lee en cada llamada (y no una vez al cargar el módulo) para que sea posible fijarlo en las
// pruebas; es una comparación de cadenas, no cuesta nada.

export type AuthMode = 'legacy' | 'oidc';

export function modoAuth(): AuthMode {
  return import.meta.env.VITE_AUTH_MODE === 'oidc' ? 'oidc' : 'legacy';
}

/** true solo en modo `oidc`. Cualquier otro valor (o ninguno) deja el login actual intacto. */
export function esOidc(): boolean {
  return modoAuth() === 'oidc';
}
