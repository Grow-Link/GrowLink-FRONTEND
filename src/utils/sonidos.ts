// Sonidos de la trivia, sintetizados con la Web Audio API: no hay archivos que descargar ni derechos de autor
// de por medio. Los navegadores solo dejan sonar el audio después de que la persona toca algo en la página, y
// aquí siempre es así (todo empieza con un clic), pero por si acaso el contexto se "despierta" antes de sonar.

export type Sonido = 'correcto' | 'incorrecto' | 'tick' | 'pregunta' | 'unirse' | 'reto' | 'ganar' | 'terminar' | 'racha';

const CLAVE_SILENCIO = 'gl_sonido_silenciado';

let contexto: AudioContext | null = null;

function leerSilencio(): boolean {
  try {
    return localStorage.getItem(CLAVE_SILENCIO) === '1';
  } catch {
    return false;
  }
}

let silenciado = leerSilencio();

export function estaSilenciado(): boolean {
  return silenciado;
}

export function silenciar(valor: boolean): void {
  silenciado = valor;
  try {
    localStorage.setItem(CLAVE_SILENCIO, valor ? '1' : '0');
  } catch {
    // sin almacenamiento disponible: solo vale para esta visita
  }
}

function audio(): AudioContext | null {
  if (silenciado) return null;
  try {
    const Clase = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Clase) return null;
    contexto ??= new Clase();
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

interface Nota {
  /** Frecuencia en Hz. */
  f: number;
  /** Cuándo empieza, en segundos desde que se pidió el sonido. */
  en: number;
  /** Cuánto dura. */
  dur: number;
  tipo?: OscillatorType;
  volumen?: number;
}

function tocar(notas: Nota[]): void {
  const ctx = audio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  for (const n of notas) {
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.type = n.tipo ?? 'sine';
    osc.frequency.value = n.f;
    const inicio = t0 + n.en;
    const volumen = n.volumen ?? 0.12;
    // entrada y salida suaves para que no "truene"
    ganancia.gain.setValueAtTime(0.0001, inicio);
    ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.015);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + n.dur);
    osc.connect(ganancia).connect(ctx.destination);
    osc.start(inicio);
    osc.stop(inicio + n.dur + 0.03);
  }
}

// Do mayor, para que todo suene alegre y no estridente
const DO = 523.25;
const MI = 659.25;
const SOL = 783.99;
const DO_ALTO = 1046.5;

const SONIDOS: Record<Sonido, Nota[]> = {
  correcto: [
    { f: MI, en: 0, dur: 0.14, tipo: 'triangle' },
    { f: SOL, en: 0.09, dur: 0.14, tipo: 'triangle' },
    { f: DO_ALTO, en: 0.18, dur: 0.28, tipo: 'triangle' },
  ],
  incorrecto: [
    { f: 233, en: 0, dur: 0.18, tipo: 'sawtooth', volumen: 0.07 },
    { f: 196, en: 0.14, dur: 0.3, tipo: 'sawtooth', volumen: 0.07 },
  ],
  tick: [{ f: 880, en: 0, dur: 0.06, tipo: 'square', volumen: 0.04 }],
  pregunta: [
    { f: SOL, en: 0, dur: 0.1, tipo: 'sine', volumen: 0.09 },
    { f: DO_ALTO, en: 0.1, dur: 0.16, tipo: 'sine', volumen: 0.09 },
  ],
  unirse: [
    { f: DO, en: 0, dur: 0.1, tipo: 'sine', volumen: 0.1 },
    { f: SOL, en: 0.08, dur: 0.14, tipo: 'sine', volumen: 0.1 },
  ],
  reto: [
    { f: SOL, en: 0, dur: 0.12, tipo: 'triangle' },
    { f: SOL, en: 0.16, dur: 0.12, tipo: 'triangle' },
    { f: DO_ALTO, en: 0.32, dur: 0.3, tipo: 'triangle' },
  ],
  racha: [
    { f: DO, en: 0, dur: 0.09, tipo: 'triangle' },
    { f: MI, en: 0.07, dur: 0.09, tipo: 'triangle' },
    { f: SOL, en: 0.14, dur: 0.09, tipo: 'triangle' },
    { f: DO_ALTO, en: 0.21, dur: 0.09, tipo: 'triangle' },
    { f: 1318.5, en: 0.28, dur: 0.3, tipo: 'triangle' },
  ],
  ganar: [
    { f: DO, en: 0, dur: 0.16, tipo: 'triangle' },
    { f: MI, en: 0.14, dur: 0.16, tipo: 'triangle' },
    { f: SOL, en: 0.28, dur: 0.16, tipo: 'triangle' },
    { f: DO_ALTO, en: 0.42, dur: 0.4, tipo: 'triangle' },
    { f: SOL, en: 0.7, dur: 0.14, tipo: 'triangle' },
    { f: DO_ALTO, en: 0.84, dur: 0.6, tipo: 'triangle' },
  ],
  terminar: [
    { f: SOL, en: 0, dur: 0.18, tipo: 'sine', volumen: 0.1 },
    { f: MI, en: 0.16, dur: 0.18, tipo: 'sine', volumen: 0.1 },
    { f: DO, en: 0.32, dur: 0.4, tipo: 'sine', volumen: 0.1 },
  ],
};

export function sonar(sonido: Sonido): void {
  tocar(SONIDOS[sonido]);
}
