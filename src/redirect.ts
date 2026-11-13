// Página de retorno del inicio de sesión con Microsoft (redirect.html). MSAL 5 exige una página dedicada: lo único
// que hace es leer la respuesta de Microsoft de la dirección y entregársela a la ventana de la app, que la espera.
// No carga React ni el enrutador (ver redirect.html para el porqué).
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

broadcastResponseToMainFrame().catch(() => {
  // sin respuesta en la dirección (alguien abrió esta página a mano): no hay nada que entregar, se vuelve a la app
  window.location.replace('/');
});
