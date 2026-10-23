import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from 'react';
import { CATEGORY_STYLE } from '../CategoryGlyph';
import Brote from './Brote';
import CambioDePersonaje from './CambioDePersonaje';
import { getSession } from '../../services/backendSession';
import { datosDe, estudiaIngles, FRASES_INGLES, type FraseIngles } from '../../utils/datosCuriosos';
import {
  aparienciaDe,
  firmaDe,
  guardarFirma,
  guardarGenero,
  leerFirma,
  leerGenero,
  novedadesEntre,
  type AccesorioId,
  type Apariencia,
  type Genero,
  type Novedad,
} from '../../utils/personaje';
import type { NodeStatus, RoadmapNode, RoadmapView } from '../../utils/roadmapModel';

// El mapa del roadmap como un grafo de verdad (cada curso es un nodo y cada requisito, una línea) dentro de un
// mundo con dos pieles: de noche, un viaje de la Tierra a la Luna entre constelaciones; de día, el caminito
// ilustrado con la casita y el castillo. Un personaje (el brote) camina por las líneas hasta el curso que toques,
// cambia con lo que vas aprobando y cuenta datos curiosos de lo que ya aprendiste. En pantallas anchas se recorre
// con la cámara (arrastrar y acercar); en el celular se despliega hacia abajo.

export type TemaMundo = 'noche' | 'dia';

interface Props {
  vista: RoadmapView;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  tema: TemaMundo;
  /** Si viene, el mapa muestra el botón para cambiar entre noche y día. */
  onCambiarTema?: (tema: TemaMundo) => void;
}

interface Pt {
  x: number;
  y: number;
}

type Ext = number | 'inicio' | 'meta';
type Orientacion = 'h' | 'v';

interface Colocado {
  nodo: RoadmapNode;
  paso: number;
  x: number;
  y: number;
}

interface Banda {
  index: number;
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
  completa: boolean;
}

interface Arista {
  id: string;
  de: Ext;
  a: Ext;
  d: string;
  /** Los cuatro puntos de la curva (inicio, dos de control y fin): por ahí camina el personaje. */
  g: [Pt, Pt, Pt, Pt];
  /** Estrellitas que adornan el tramo. */
  brillos: Pt[];
}

interface Plano {
  orient: Orientacion;
  colocados: Colocado[];
  inicio: Pt;
  meta: Pt;
  ancho: number;
  alto: number;
  bandas: Banda[];
  aristas: Arista[];
  /** Dónde se queda parado el personaje en cada lugar. */
  reposo: (e: Ext) => Pt;
}

interface Cam {
  x: number;
  y: number;
  k: number;
}

interface Dicho {
  titulo?: string;
  texto: string;
  ingles?: FraseIngles;
  tono: 'dato' | 'aviso';
  punto: Pt;
  otro?: boolean;
}

const HEX_W = 84;
const HEX_H = 96;
const HEX = '42,2 80,24 80,72 42,94 4,72 4,24';
const ETIQUETA_ALTO = 80;
const COL = 236;
const FILA = 234;
const K_MIN = 0.32;
const K_MAX = 1.8;

const NIVEL_PUNTOS: Record<string, number> = { principiante: 1, intermedio: 2, avanzado: 3 };

const ESTADO: Record<NodeStatus, { borde: string; glow: string; texto: string; fondo: string }> = {
  completed: { borde: '#4CE07E', glow: 'rgba(76,224,126,0.7)', texto: '#4CE07E', fondo: 'rgba(76,224,126,0.14)' },
  current: { borde: '#F5A524', glow: 'rgba(245,165,36,0.8)', texto: '#F8C961', fondo: 'rgba(245,165,36,0.16)' },
  available: { borde: '#5FD3C2', glow: 'rgba(95,211,194,0.55)', texto: '#7EDCCB', fondo: 'rgba(95,211,194,0.13)' },
  locked: { borde: '#3C5650', glow: 'rgba(0,0,0,0)', texto: '#8CA39B', fondo: 'rgba(255,255,255,0.06)' },
  unavailable: { borde: '#7A2F2F', glow: 'rgba(0,0,0,0)', texto: '#F87171', fondo: 'rgba(248,113,113,0.14)' },
};

// de día los textos de estado se oscurecen para leerse sobre el fondo claro
const TEXTO_DIA: Record<NodeStatus, string> = { completed: '#15803D', current: '#B45309', available: '#0B6F65', locked: '#5B6B65', unavailable: '#DC2626' };

const FONDO = {
  noche: 'linear-gradient(to bottom, #050D0C 0%, #0A1F1E 55%, #0F3330 100%)',
  dia: 'linear-gradient(to bottom, #C9EFE0 0%, #DDF5EA 55%, #BDEAD3 100%)',
};

const MONTANAS = {
  noche: { atras: '#0B2527', hierba: '#071A1B', pinos: '#05100F' },
  dia: { atras: '#9CC9DF', hierba: '#93D8B2', pinos: '#2FA06A' },
};

function textoDeEstado(n: RoadmapNode): string {
  switch (n.status) {
    case 'completed':
      return n.dadoDeBaja ? 'Aprobado · ya no disponible' : 'Aprobado';
    case 'current':
      return 'Tu siguiente paso';
    case 'available':
      return 'Listo para ti';
    case 'unavailable':
      return 'Ya no disponible';
    default: {
      const falta = n.prerequisitos.find((p) => !p.hecho);
      return falta ? `Antes: ${falta.titulo}` : 'Bloqueado';
    }
  }
}

/** Un botón de la barra de herramientas del mapa: solo el ícono, con su nombre para quien usa lector de pantalla. */
function Herramienta({ titulo, onClick, noche, activo, children }: { titulo: string; onClick: () => void; noche: boolean; activo?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={titulo}
      title={titulo}
      aria-pressed={activo}
      onClick={onClick}
      className={`w-9 h-9 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#12C2A8] ${
        noche ? 'text-white hover:bg-white/10' : 'text-[#1F2D2A] hover:bg-[#0E8A7D]/10'
      } ${activo ? (noche ? 'bg-white/15' : 'bg-[#0E8A7D]/15') : ''}`}
    >
      {children}
    </button>
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const limitarK = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function bezier(g: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * g[0].x + 3 * u * u * t * g[1].x + 3 * u * t * t * g[2].x + t * t * t * g[3].x,
    y: u * u * u * g[0].y + 3 * u * u * t * g[1].y + 3 * u * t * t * g[2].y + t * t * t * g[3].y,
  };
}

// ---- el cielo: dos capas de estrellas, constelaciones de fondo y la cordillera con pinos --------------------------

function azulejoDeEstrellas(semilla: number, cuantas: number, lado: number, rMax: number, tinte: string): string {
  const rand = mulberry32(semilla);
  let s = `<svg xmlns='http://www.w3.org/2000/svg' width='${lado}' height='${lado}'>`;
  for (let i = 0; i < cuantas; i++) {
    s += `<circle cx='${(rand() * lado).toFixed(0)}' cy='${(rand() * lado).toFixed(0)}' r='${(0.4 + rand() * rMax).toFixed(2)}' fill='${tinte}' fill-opacity='${(0.3 + rand() * 0.65).toFixed(2)}'/>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`${s}</svg>`)}")`;
}

const ESTRELLAS_LEJOS = azulejoDeEstrellas(11, 46, 360, 0.9, '#CFE9E4');
const ESTRELLAS_CERCA = azulejoDeEstrellas(29, 16, 520, 1.5, '#FFF4D0');

// figuras de fondo, muy tenues: solo ambientan el cielo
const FIGURAS: { pts: [number, number][]; izq: string; arriba: string }[] = [
  { pts: [[6, 52], [26, 46], [44, 54], [60, 42], [78, 32], [96, 28], [110, 10]], izq: '5%', arriba: '58%' },
  { pts: [[6, 18], [28, 56], [52, 28], [78, 58], [106, 16]], izq: '62%', arriba: '6%' },
  { pts: [[8, 62], [34, 40], [60, 46], [86, 20], [112, 30]], izq: '30%', arriba: '3%' },
];

function crearCordillera() {
  const rand = mulberry32(2024);
  const ancho = 1600;
  const fondo: string[] = [];
  for (let x = -40; x <= ancho + 40; x += 70) fondo.push(`${x} ${232 - (60 + rand() * 90)}`);
  const atras = `M -40 240 L ${fondo.join(' L ')} L ${ancho + 40} 240 Z`;

  const altura = (x: number) => 206 - 30 * (0.5 + 0.5 * Math.sin(x / 150 + 1.3)) - 12 * (0.5 + 0.5 * Math.sin(x / 47));
  const frente: string[] = [];
  for (let x = -40; x <= ancho + 40; x += 20) frente.push(`${x} ${altura(x).toFixed(1)}`);
  const hierba = `M -40 240 L ${frente.join(' L ')} L ${ancho + 40} 240 Z`;

  const pinos: string[] = [];
  for (let x = -20; x < ancho + 20; x += 20 + rand() * 24) {
    const y = altura(x) + 4;
    const s = 0.8 + rand() * 0.7;
    pinos.push(`M ${x} ${y - 30 * s} L ${x + 8 * s} ${y - 8 * s} L ${x - 8 * s} ${y - 8 * s} Z M ${x} ${y - 20 * s} L ${x + 11 * s} ${y + 2 * s} L ${x - 11 * s} ${y + 2 * s} Z`);
  }
  return { atras, hierba, pinos: pinos.join(' ') };
}

const CORDILLERA = crearCordillera();

// ---- el plano: dónde va cada nodo --------------------------------------------------------------------------------

function armarPlano(nodos: RoadmapNode[], stages: RoadmapView['stages'], orient: Orientacion, anchoCaja: number, tema: TemaMundo): Plano {
  const noche = tema === 'noche';
  const total = Math.max(1, stages.length);
  const hijosDe = new Map<number, number[]>();
  nodos.forEach((n) => n.prerequisitos.forEach((p) => hijosDe.set(p.cursoId, [...(hijosDe.get(p.cursoId) ?? []), n.cursoId])));

  // dentro de cada etapa, cada curso queda cerca de sus requisitos para que las líneas no se crucen de más
  const rango = new Map<number, number>();
  const grupos: RoadmapNode[][] = [];
  for (let s = 0; s < total; s++) {
    const delGrupo = nodos.filter((n) => n.etapa === s);
    const clave = (n: RoadmapNode) => {
      const previos = n.prerequisitos.map((p) => rango.get(p.cursoId)).filter((v): v is number => v !== undefined);
      return previos.length ? previos.reduce((a, b) => a + b, 0) / previos.length : 0;
    };
    delGrupo.sort((a, b) => clave(a) - clave(b) || a.orden - b.orden);
    delGrupo.forEach((n, i) => rango.set(n.cursoId, i - (delGrupo.length - 1) / 2));
    grupos.push(delGrupo);
  }
  const paso = new Map(nodos.map((n, i) => [n.cursoId, i + 1]));
  const colocados: Colocado[] = [];
  const bandas: Banda[] = [];
  let inicio: Pt;
  let meta: Pt;
  let ancho: number;
  let alto: number;

  if (orient === 'h') {
    const mayor = Math.max(1, ...grupos.map((g) => g.length));
    const contenido = (mayor - 1) * FILA;
    const padX = 130;
    alto = 128 + 48 + contenido + 134 + 44;
    const cy = 176 + contenido / 2;
    grupos.forEach((g, s) => {
      const cx = padX + COL * (s + 1);
      g.forEach((n, i) => {
        const desfase = g.length > 1 ? (i % 2 === 0 ? -10 : 10) : 0;
        colocados.push({ nodo: n, paso: paso.get(n.cursoId) ?? 0, x: cx + desfase, y: cy + (i - (g.length - 1) / 2) * FILA });
      });
      bandas.push({
        index: s,
        nombre: stages[s]?.nombre ?? '',
        x: cx - COL / 2 + 10,
        y: 64,
        w: COL - 20,
        h: alto - 64 - 24,
        completa: g.length > 0 && g.every((n) => n.status === 'completed'),
      });
    });
    inicio = { x: padX, y: cy };
    meta = { x: padX + COL * (total + 1), y: cy };
    ancho = meta.x + padX + 20;
  } else {
    const columnas = Math.max(2, Math.min(4, Math.floor((anchoCaja - 16) / 150)));
    const pasoX = Math.min(190, (anchoCaja - 16) / columnas);
    ancho = anchoCaja;
    inicio = { x: ancho / 2, y: 76 };
    let cursor = 156;
    grupos.forEach((g, s) => {
      const arriba = cursor;
      cursor += 52;
      for (let i = 0; i < g.length; i += columnas) {
        const fila = g.slice(i, i + columnas);
        const cy = cursor + 48;
        fila.forEach((n, j) => {
          colocados.push({ nodo: n, paso: paso.get(n.cursoId) ?? 0, x: ancho / 2 + (j - (fila.length - 1) / 2) * pasoX, y: cy });
        });
        cursor = cy + 48 + 6 + ETIQUETA_ALTO + 52;
      }
      bandas.push({
        index: s,
        nombre: stages[s]?.nombre ?? '',
        x: 6,
        y: arriba,
        w: ancho - 12,
        h: cursor - arriba - 30,
        completa: g.length > 0 && g.every((n) => n.status === 'completed'),
      });
      cursor += 6;
    });
    meta = { x: ancho / 2, y: cursor + 76 };
    alto = meta.y + 110;
  }

  const posDe = new Map(colocados.map((c) => [c.nodo.cursoId, c]));
  const salida = (e: Ext): Pt => {
    if (e === 'inicio') {
      if (noche) return orient === 'h' ? { x: inicio.x + 52, y: inicio.y } : { x: inicio.x, y: inicio.y + 80 };
      return orient === 'h' ? { x: inicio.x + 34, y: inicio.y } : { x: inicio.x, y: inicio.y + 40 };
    }
    if (e === 'meta') return meta;
    const c = posDe.get(e)!;
    return orient === 'h' ? { x: c.x + HEX_W / 2 + 2, y: c.y } : { x: c.x, y: c.y + 48 + 4 + ETIQUETA_ALTO };
  };
  const entrada = (e: Ext): Pt => {
    if (e === 'meta') {
      if (noche) return orient === 'h' ? { x: meta.x - 60, y: meta.y } : { x: meta.x, y: meta.y - 62 };
      return orient === 'h' ? { x: meta.x - 58, y: meta.y } : { x: meta.x, y: meta.y - 58 };
    }
    if (e === 'inicio') return inicio;
    const c = posDe.get(e)!;
    return orient === 'h' ? { x: c.x - HEX_W / 2 - 2, y: c.y } : { x: c.x, y: c.y - 52 };
  };
  const curva = (a: Pt, b: Pt): Pick<Arista, 'd' | 'g' | 'brillos'> => {
    let c1: Pt;
    let c2: Pt;
    if (orient === 'h') {
      const dx = Math.max(40, (b.x - a.x) * 0.55);
      c1 = { x: a.x + dx, y: a.y };
      c2 = { x: b.x - dx, y: b.y };
    } else {
      const dy = Math.max(36, (b.y - a.y) * 0.5);
      c1 = { x: a.x, y: a.y + dy };
      c2 = { x: b.x, y: b.y - dy };
    }
    const g: [Pt, Pt, Pt, Pt] = [a, c1, c2, b];
    return { d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`, g, brillos: [bezier(g, 0.3), bezier(g, 0.7)] };
  };

  const aristas: Arista[] = [];
  nodos.forEach((n) => {
    if (n.prerequisitos.length === 0) aristas.push({ id: `i-${n.cursoId}`, de: 'inicio', a: n.cursoId, ...curva(salida('inicio'), entrada(n.cursoId)) });
    n.prerequisitos.forEach((p) => aristas.push({ id: `${p.cursoId}-${n.cursoId}`, de: p.cursoId, a: n.cursoId, ...curva(salida(p.cursoId), entrada(n.cursoId)) }));
    if (!hijosDe.has(n.cursoId)) aristas.push({ id: `m-${n.cursoId}`, de: n.cursoId, a: 'meta', ...curva(salida(n.cursoId), entrada('meta')) });
  });

  const reposo = (e: Ext): Pt => {
    if (e === 'inicio') return orient === 'h' ? { x: inicio.x + (noche ? 66 : 58), y: inicio.y + 20 } : { x: inicio.x + 64, y: inicio.y + 44 };
    if (e === 'meta') return orient === 'h' ? { x: meta.x - 72, y: meta.y + 34 } : { x: meta.x - 72, y: meta.y + 40 };
    const c = posDe.get(e);
    if (!c) return reposo('inicio'); // un curso que ya no está en la ruta (por ejemplo, tras actualizar el roadmap)
    return orient === 'h' ? { x: c.x + 54, y: c.y + 10 } : { x: c.x + 58, y: c.y + 12 };
  };

  return { orient, colocados, inicio, meta, ancho, alto, bandas, aristas, reposo };
}

// ---- piezas pequeñas ---------------------------------------------------------------------------------------------

function Casa({ x, y, horizontal }: Pt & { horizontal: boolean }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x - 60, top: y - (horizontal ? 66 : 62), width: 120 }}>
      <svg viewBox="0 0 120 100" width={120} height={100} aria-hidden="true">
        <ellipse cx={60} cy={92} rx={40} ry={6} fill="#000" opacity={0.22} />
        <rect x={76} y={22} width={8} height={18} fill="#8A6B4A" />
        <rect x={32} y={44} width={56} height={44} rx={3} fill="#F6CE86" />
        <path d="M24 48 L60 14 L96 48 Z" fill="#E8604C" />
        <rect x={54} y={64} width={14} height={24} rx={2} fill="#8B5A3C" />
        <rect x={38} y={56} width={11} height={11} fill="#fff" opacity={0.8} />
        <rect x={71} y={56} width={11} height={11} fill="#fff" opacity={0.8} />
      </svg>
      <p className="text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#0B6F65] -mt-1">Inicio</p>
    </div>
  );
}

function Castillo({ x, y, encendido, meta }: Pt & { encendido: boolean; meta: string }) {
  const recorte = meta.length > 34 ? `${meta.slice(0, 33)}…` : meta;
  return (
    <div className="absolute pointer-events-none" style={{ left: x - 75, top: y - 80, width: 150 }}>
      <svg viewBox="0 0 150 130" width={150} height={130} aria-hidden="true">
        <ellipse cx={75} cy={118} rx={58} ry={7} fill="#000" opacity={0.2} />
        <rect x={45} y={52} width={60} height={62} fill="#C9D3E2" />
        <rect x={22} y={32} width={26} height={82} fill="#9FB0C7" />
        <rect x={102} y={32} width={26} height={82} fill="#9FB0C7" />
        {[22, 31, 40, 102, 111, 120].map((cx) => (
          <rect key={cx} x={cx} y={24} width={7} height={9} fill="#9FB0C7" />
        ))}
        <path d="M63 114 L63 92 A12 12 0 0 1 87 92 L87 114 Z" fill="#8B5A3C" />
        <path d="M75 52 L75 14" stroke="#8B6B4A" strokeWidth={2.5} />
        <path d="M75 14 L99 22 L75 30 Z" fill={encendido ? '#4CE07E' : '#9AA89F'} />
      </svg>
      <p className="relative text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#0B6F65] -mt-1">{encendido ? 'Meta alcanzada' : 'Tu meta'}</p>
      {recorte && <p className="relative text-center text-[11px] text-[#1F2D2A] leading-snug mt-0.5 px-2">«{recorte}»</p>}
    </div>
  );
}

function Tierra({ x, y, uid }: Pt & { uid: string }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x - 48, top: y - 48, width: 96 }}>
      <div aria-hidden="true" className="absolute -inset-4 rounded-full blur-xl" style={{ background: 'radial-gradient(circle, rgba(95,211,194,0.32), transparent 70%)' }} />
      <svg viewBox="0 0 96 96" width={96} height={96} className="relative overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-mar`} cx="0.34" cy="0.3" r="0.95">
            <stop offset="0" stopColor="#3FB6C9" />
            <stop offset="0.6" stopColor="#1E7F9A" />
            <stop offset="1" stopColor="#0C3E57" />
          </radialGradient>
          <radialGradient id={`${uid}-sombra`} cx="0.3" cy="0.28" r="0.9">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.5" />
          </radialGradient>
          <clipPath id={`${uid}-tierra`}>
            <circle cx={48} cy={48} r={44} />
          </clipPath>
        </defs>
        <circle cx={48} cy={48} r={44} fill={`url(#${uid}-mar)`} />
        <g clipPath={`url(#${uid}-tierra)`}>
          <path d="M18 30 Q30 20 44 27 Q49 38 40 47 Q31 45 25 52 Q14 45 18 30 Z" fill="#3FBF7A" />
          <path d="M54 44 Q68 38 78 50 Q76 65 63 72 Q55 63 54 44 Z" fill="#35AD6E" />
          <path d="M42 68 Q50 65 55 72 Q50 82 42 77 Z" fill="#3FBF7A" />
          <g className="gl-cloud">
            <ellipse cx={34} cy={36} rx={14} ry={3.4} fill="#fff" opacity={0.5} />
            <ellipse cx={64} cy={58} rx={12} ry={3} fill="#fff" opacity={0.45} />
          </g>
        </g>
        <circle cx={48} cy={48} r={44} fill={`url(#${uid}-sombra)`} />
        <circle cx={48} cy={48} r={44} fill="none" stroke="rgba(190,240,230,0.45)" strokeWidth={1.4} />
        <g transform="rotate(-24 48 48)">
          <ellipse cx={48} cy={48} rx={64} ry={17} fill="none" stroke="rgba(190,240,230,0.14)" strokeWidth={1} strokeDasharray="2 5" />
          <g>
            <animateMotion dur="11s" repeatCount="indefinite" path="M -16 48 A 64 17 0 1 1 112 48 A 64 17 0 1 1 -16 48" />
            <rect x={-2.5} y={-1.6} width={5} height={3.2} rx={0.8} fill="#E6EFE9" />
            <rect x={-5.6} y={-0.7} width={2.8} height={1.4} fill="#F5A524" />
            <rect x={2.8} y={-0.7} width={2.8} height={1.4} fill="#F5A524" />
          </g>
        </g>
      </svg>
      <p className="relative -mx-10 text-center whitespace-nowrap text-[10px] font-mono font-bold uppercase tracking-widest text-[#98B0A6] mt-1">Tierra · Inicio</p>
    </div>
  );
}

function Luna({ x, y, encendida, meta, uid }: Pt & { encendida: boolean; meta: string; uid: string }) {
  const recorte = meta.length > 34 ? `${meta.slice(0, 33)}…` : meta;
  return (
    <div className="absolute pointer-events-none" style={{ left: x - 75, top: y - 56, width: 150 }}>
      <div className="relative mx-auto" style={{ width: 112, height: 112 }}>
        <div aria-hidden="true" className="absolute -inset-5 rounded-full blur-xl" style={{ background: `radial-gradient(circle, rgba(243,240,220,${encendida ? 0.5 : 0.22}), transparent 70%)` }} />
        <svg viewBox="0 0 112 112" width={112} height={112} className="relative overflow-visible" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-luna`} cx="0.34" cy="0.3" r="0.95">
              <stop offset="0" stopColor="#FBF8E8" />
              <stop offset="0.7" stopColor="#D9D3B2" />
              <stop offset="1" stopColor="#A9A388" />
            </radialGradient>
          </defs>
          <circle cx={56} cy={56} r={50} fill={`url(#${uid}-luna)`} />
          {[
            [38, 40, 9],
            [72, 34, 6],
            [66, 70, 11],
            [36, 74, 5],
            [82, 56, 4],
          ].map(([cx, cy, r], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="rgba(120,112,86,0.32)" />
              <circle cx={cx - r * 0.18} cy={cy - r * 0.18} r={r * 0.78} fill="rgba(255,255,255,0.18)" />
            </g>
          ))}
          {!encendida && <circle cx={56} cy={56} r={55} fill="none" stroke="rgba(243,240,220,0.35)" strokeWidth={1} strokeDasharray="3 6" />}
          {encendida && (
            <g>
              <path d="M82 26 V0" stroke="#E6EFE9" strokeWidth={2.4} strokeLinecap="round" />
              <path d="M82 0 L106 7 L82 14 Z" fill="#4CE07E" />
            </g>
          )}
        </svg>
      </div>
      <p className="relative text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#98B0A6] mt-2">{encendida ? 'Llegaste a la Luna' : 'Luna · Tu meta'}</p>
      {recorte && <p className="relative text-center text-[11px] text-[#E6EFE9]/85 leading-snug mt-0.5 px-2">«{recorte}»</p>}
    </div>
  );
}

function Nivel({ nivel, apagado }: { nivel: string; apagado: string }) {
  const n = NIVEL_PUNTOS[nivel] ?? 1;
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-1 h-2.5 rounded-sm ${i <= n ? 'bg-[#12C2A8]' : apagado}`} />
      ))}
    </span>
  );
}

const NAVE = 'M7 0 L-1.5 -3.1 L-4.2 -2 L-4.2 2 L-1.5 3.1 Z';

// ---- el mapa -----------------------------------------------------------------------------------------------------

export default function MundoMap({ vista, selectedId, onSelect, tema, onCambiarTema }: Props) {
  const noche = tema === 'noche';
  const uid = useId().replace(/:/g, '');
  const contenedor = useRef<HTMLDivElement>(null);
  const [caja, setCaja] = useState({ w: 0, h: 0 });
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, k: 1 });
  const [duracion, setDuracion] = useState(0);
  const [sobre, setSobre] = useState<number | null>(null);
  const [agarrando, setAgarrando] = useState(false);
  const [brote, setBrote] = useState<Set<number>>(new Set());
  const [pistaVista, setPistaVista] = useState(true);
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);

  // el personaje
  const [genero, setGenero] = useState<Genero>(leerGenero);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [caminando, setCaminando] = useState(false);
  const [celebrando, setCelebrando] = useState(false);
  const [negando, setNegando] = useState(false);
  const [dicho, setDicho] = useState<Dicho | null>(null);
  const [cambio, setCambio] = useState<{ antes: { rango: number; accesorios: AccesorioId[] }; ahora: Apariencia; novedades: Novedad[] } | null>(null);

  const nodos = useMemo(() => [...vista.nodes].sort((a, b) => a.orden - b.orden), [vista.nodes]);
  const orient: Orientacion = caja.w >= 560 ? 'h' : 'v';
  const anchoClave = orient === 'v' ? caja.w : 0;
  const medido = caja.w > 0;
  const plano = useMemo(
    () => (medido && nodos.length > 0 ? armarPlano(nodos, vista.stages, orient, anchoClave || caja.w, tema) : null),
    [nodos, vista.stages, orient, anchoClave, medido, tema]
  );

  const camRef = useRef(cam);
  camRef.current = cam;
  const planoRef = useRef(plano);
  planoRef.current = plano;
  const cajaRef = useRef(caja);
  cajaRef.current = caja;
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const timerSuave = useRef<number | undefined>(undefined);
  const movido = useRef(false);

  const sinMovimiento = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const usuarioId = getSession()?.usuarioId ?? null;
  const apariencia = useMemo(() => aparienciaDe(vista), [vista]);
  const usaIngles = useMemo(() => estudiaIngles(nodos), [nodos]);
  const terminado = vista.progreso.total > 0 && vista.progreso.completados === vista.progreso.total;

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      setCaja((c) => (Math.round(r.width) === c.w && Math.round(r.height) === c.h ? c : { w: Math.round(r.width), h: Math.round(r.height) }));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ---- cámara -------------------------------------------------------------------------------------------------------
  const limitar = useCallback((c: Cam): Cam => {
    const p = planoRef.current;
    const b = cajaRef.current;
    if (!p) return c;
    const sw = p.ancho * c.k;
    const sh = p.alto * c.k;
    const m = 120;
    return {
      k: c.k,
      x: sw + 2 * m <= b.w ? (b.w - sw) / 2 : limitarK(c.x, b.w - sw - m, m),
      y: sh + 2 * m <= b.h ? (b.h - sh) / 2 : limitarK(c.y, b.h - sh - m, m),
    };
  }, []);

  const kAjustada = useCallback(() => {
    const p = planoRef.current;
    const b = cajaRef.current;
    if (!p) return 1;
    return limitarK(Math.min((b.w - 40) / p.ancho, (b.h - 40) / p.alto), K_MIN, 1);
  }, []);

  const volar = useCallback(
    (destino: Cam, ms = 900) => {
      window.clearTimeout(timerSuave.current);
      const dur = sinMovimiento ? 0 : ms;
      setDuracion(dur);
      setCam(limitar(destino));
      if (dur > 0) timerSuave.current = window.setTimeout(() => setDuracion(0), dur + 60);
    },
    [limitar, sinMovimiento]
  );

  const verTodo = useCallback(() => volar({ x: 0, y: 0, k: kAjustada() }, 800), [kAjustada, volar]);

  const sobreNodo = useCallback(
    (id: number, k = 1, ms = 900) => {
      const b = cajaRef.current;
      const c = planoRef.current?.colocados.find((q) => q.nodo.cursoId === id);
      if (!c) return;
      volar({ x: b.w / 2 - c.x * k, y: b.h / 2 - c.y * k, k }, ms);
    },
    [volar]
  );

  // ---- el personaje camina ------------------------------------------------------------------------------------------
  const broteEl = useRef<HTMLDivElement>(null);
  const giroEl = useRef<HTMLDivElement>(null);
  const enLugar = useRef<Ext>('inicio');
  const caminandoRef = useRef(false);
  const animBrote = useRef<number | undefined>(undefined);
  const pendiente = useRef<Ext | null>(null);
  const timerDicho = useRef<number | undefined>(undefined);
  const indiceDato = useRef(0);
  const [reposoPt, setReposoPt] = useState<Pt>({ x: 0, y: 0 });

  const poner = useCallback((p: Pt) => {
    if (broteEl.current) broteEl.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }, []);

  // si cambia el plano (por ejemplo al girar el celular) y no está caminando, se queda en su lugar
  useEffect(() => {
    if (!plano || caminandoRef.current) return;
    // si el curso donde estaba parado ya no está en la ruta (al actualizar el roadmap pasa), vuelve al inicio
    if (typeof enLugar.current === 'number' && !plano.colocados.some((c) => c.nodo.cursoId === enLugar.current)) enLugar.current = 'inicio';
    const p = plano.reposo(enLugar.current);
    poner(p);
    setReposoPt(p);
  }, [plano, poner]);

  const decir = useCallback((d: Dicho, ms = 12000) => {
    window.clearTimeout(timerDicho.current);
    setDicho(d);
    if (ms > 0) timerDicho.current = window.setTimeout(() => setDicho(null), ms);
  }, []);

  const sePuedePisar = useCallback((e: Ext): boolean => {
    if (e === 'inicio') return true;
    if (e === 'meta') {
      const v = vistaRef.current;
      return v.progreso.total > 0 && v.progreso.completados === v.progreso.total;
    }
    const n = vistaRef.current.nodes.find((q) => q.cursoId === e);
    return !!n && (n.status === 'completed' || n.status === 'current' || n.status === 'available');
  }, []);

  /** El camino más corto entre dos lugares pisando solo lo que ya se puede pisar. */
  const rutaHacia = useCallback(
    (desde: Ext, hasta: Ext): Ext[] | null => {
      const p = planoRef.current;
      if (!p || !sePuedePisar(hasta)) return null;
      const vecinos = new Map<Ext, Ext[]>();
      const unir = (a: Ext, b: Ext) => vecinos.set(a, [...(vecinos.get(a) ?? []), b]);
      p.aristas.forEach((a) => {
        unir(a.de, a.a);
        unir(a.a, a.de);
      });
      const previo = new Map<Ext, Ext | null>([[desde, null]]);
      const cola: Ext[] = [desde];
      while (cola.length) {
        const actual = cola.shift()!;
        if (actual === hasta) break;
        for (const v of vecinos.get(actual) ?? []) {
          if (previo.has(v) || !sePuedePisar(v)) continue;
          previo.set(v, actual);
          cola.push(v);
        }
      }
      if (!previo.has(hasta)) return null;
      const ruta: Ext[] = [];
      for (let e: Ext | null = hasta; e !== null; e = previo.get(e) ?? null) ruta.push(e);
      return ruta.reverse();
    },
    [sePuedePisar]
  );

  const camino = useCallback((ruta: Ext[]): Pt[] => {
    const p = planoRef.current!;
    const puntos: Pt[] = [p.reposo(ruta[0])];
    for (let i = 0; i < ruta.length - 1; i++) {
      const [a, b] = [ruta[i], ruta[i + 1]];
      const directa = p.aristas.find((e) => e.de === a && e.a === b);
      const arista = directa ?? p.aristas.find((e) => e.de === b && e.a === a)!;
      const muestras = Array.from({ length: 26 }, (_, k) => bezier(arista.g, k / 25));
      puntos.push(...(directa ? muestras : muestras.reverse()));
    }
    puntos.push(p.reposo(ruta[ruta.length - 1]));
    return puntos;
  }, []);

  const moverBrote = useCallback(
    (destino: Ext, opciones: { alFinal?: () => void; seguir?: boolean } = {}) => {
      const p = planoRef.current;
      if (!p) return;
      if (caminandoRef.current) {
        pendiente.current = destino;
        return;
      }
      const ruta = rutaHacia(enLugar.current, destino);
      if (!ruta) return;
      const terminar = () => {
        enLugar.current = destino;
        caminandoRef.current = false;
        setCaminando(false);
        const rp = planoRef.current?.reposo(destino) ?? p.reposo(destino);
        poner(rp);
        setReposoPt(rp);
        opciones.alFinal?.();
        const siguiente = pendiente.current;
        pendiente.current = null;
        if (siguiente !== null && siguiente !== destino) window.setTimeout(() => moverBrote(siguiente), 120);
      };
      if (ruta.length < 2) {
        terminar();
        return;
      }
      window.clearTimeout(timerDicho.current);
      setDicho(null);
      const pts = camino(ruta);
      const acumulado = [0];
      for (let i = 1; i < pts.length; i++) acumulado.push(acumulado[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const largo = acumulado[acumulado.length - 1];
      const ms = sinMovimiento ? 0 : limitarK((largo / 230) * 1000, 800, 4200);
      if (ms === 0) {
        terminar();
        return;
      }
      caminandoRef.current = true;
      setCaminando(true);
      if (opciones.seguir !== false) {
        if (p.orient === 'h' && typeof destino === 'number') sobreNodo(destino, Math.max(0.95, camRef.current.k), ms);
        else if (p.orient === 'v' && contenedor.current) {
          const rp = p.reposo(destino);
          const r = contenedor.current.getBoundingClientRect();
          window.scrollTo({ top: window.scrollY + r.top + rp.y - window.innerHeight / 2, behavior: 'smooth' });
        }
      }
      const t0 = performance.now();
      const paso = (ahora: number) => {
        const u = Math.min(1, (ahora - t0) / ms);
        const suave = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; // arranca y frena con suavidad
        const d = suave * largo;
        let i = 1;
        while (i < acumulado.length - 1 && acumulado[i] < d) i++;
        const tramo = Math.max(0.0001, acumulado[i] - acumulado[i - 1]);
        const f = limitarK((d - acumulado[i - 1]) / tramo, 0, 1);
        const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f;
        const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f;
        if (broteEl.current) broteEl.current.style.transform = `translate(${x}px, ${y}px)`;
        const dx = pts[i].x - pts[i - 1].x;
        if (giroEl.current && Math.abs(dx) > 0.2) giroEl.current.style.transform = `scaleX(${dx < 0 ? -1 : 1})`;
        if (u < 1) animBrote.current = requestAnimationFrame(paso);
        else terminar();
      };
      cancelAnimationFrame(animBrote.current ?? 0);
      animBrote.current = requestAnimationFrame(paso);
    },
    [rutaHacia, camino, poner, sobreNodo, sinMovimiento]
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(animBrote.current ?? 0);
      window.clearTimeout(timerDicho.current);
    },
    []
  );

  // ---- lo que dice y lo que cambia ----------------------------------------------------------------------------------
  const frase = (lista: FraseIngles[]) => lista[Math.floor(Math.random() * lista.length)];

  const datosAprobados = useCallback(() => {
    const lista: { titulo: string; dato: string }[] = [];
    vistaRef.current.nodes
      .filter((n) => n.status === 'completed')
      .forEach((n) => {
        // si el paso se cumplió con una alternativa, los datos son del curso que de verdad se aprobó
        const base = n.cumplidoCon ? { titulo: n.cumplidoCon.titulo, categoria: n.categoria } : n;
        datosDe(base).forEach((dato) => lista.push({ titulo: base.titulo, dato }));
      });
    return lista;
  }, []);

  /** Si el personaje cambió desde la última vez que la persona lo vio, muestra la pantalla de cambio. */
  const revisarCambio = useCallback((): boolean => {
    if (usuarioId === null) return false;
    const ahora = aparienciaDe(vistaRef.current);
    const firma = firmaDe(ahora);
    const antes = leerFirma(usuarioId);
    guardarFirma(usuarioId, firma);
    const novedades = novedadesEntre(antes, ahora);
    if (!antes || novedades.length === 0) return false;
    const [rangoAntes, accesoriosAntes = ''] = antes.split('|');
    setCambio({ antes: { rango: Number(rangoAntes) || 1, accesorios: accesoriosAntes.split(',').filter(Boolean) as AccesorioId[] }, ahora, novedades });
    return true;
  }, [usuarioId]);

  const contarDatoDe = useCallback(
    (n: RoadmapNode) => {
      const rp = planoRef.current?.reposo(enLugar.current) ?? reposoPt;
      const aprobado = n.cumplidoCon ? { titulo: n.cumplidoCon.titulo, categoria: n.categoria } : n;
      const datos = datosDe(aprobado);
      decir(
        {
          titulo: `Aprobaste «${aprobado.titulo}»`,
          texto: datos.length ? `Dato curioso: ${datos[0]}` : n.habilidades.length ? `Con este curso ya tienes: ${n.habilidades.join(', ')}.` : 'Un curso menos en tu ruta.',
          ingles: usaIngles ? frase(FRASES_INGLES.aprobo) : undefined,
          tono: 'dato',
          punto: rp,
        },
        14000
      );
    },
    [decir, usaIngles, reposoPt]
  );

  function alTocarBrote() {
    if (caminandoRef.current || cambio) return;
    const rp = planoRef.current?.reposo(enLugar.current) ?? reposoPt;
    const pool = datosAprobados();
    if (pool.length === 0) {
      decir(
        { texto: 'Aprueba tu primer curso y te cuento algo curioso sobre lo que aprendiste.', ingles: usaIngles ? frase(FRASES_INGLES.saludo) : undefined, tono: 'aviso', punto: rp },
        9000
      );
      return;
    }
    const d = pool[indiceDato.current % pool.length];
    indiceDato.current += 1;
    decir({ titulo: `Sobre «${d.titulo}»`, texto: d.dato, tono: 'dato', punto: rp, otro: pool.length > 1 }, 15000);
  }

  function alTocarNodo(n: RoadmapNode) {
    if (n.status === 'locked' || n.status === 'unavailable') {
      const falta = n.prerequisitos.find((p) => !p.hecho);
      const rp = planoRef.current?.reposo(enLugar.current) ?? reposoPt;
      setNegando(true);
      window.setTimeout(() => setNegando(false), 350);
      decir(
        {
          texto: n.status === 'unavailable' ? 'Este curso ya no está disponible. Actualiza tu roadmap y te busco otro.' : falta ? `Todavía no puedo ir ahí: antes necesitas aprobar «${falta.titulo}», o presentar el examen de este curso si ya lo sabes.` : 'Todavía no puedo ir ahí.',
          ingles: usaIngles && n.status === 'locked' ? frase(FRASES_INGLES.bloqueado) : undefined,
          tono: 'aviso',
          punto: rp,
        },
        8000
      );
      return;
    }
    moverBrote(n.cursoId, {
      // un curso aprobado que se dio de baja: el avance se conserva, pero se avisa
      alFinal: n.dadoDeBaja
        ? () =>
            decir(
              {
                texto: 'Ya aprobaste este curso y ese avance se queda contigo, pero se dio de baja. Actualiza tu roadmap para ver opciones activas.',
                tono: 'aviso',
                punto: planoRef.current?.reposo(n.cursoId) ?? reposoPt,
              },
              9000
            )
        : undefined,
    });
  }

  function alTocarMeta() {
    if (terminado) {
      moverBrote('meta', {
        alFinal: () => decir({ texto: `Llegaste. Tu meta era «${vista.meta}» y ya recorriste toda la ruta.`, tono: 'dato', punto: planoRef.current?.reposo('meta') ?? reposoPt }, 12000),
      });
      return;
    }
    const faltan = vista.progreso.total - vista.progreso.completados;
    decir({ texto: `Faltan ${faltan} ${faltan === 1 ? 'curso' : 'cursos'} para llegar${noche ? ' a la Luna' : ' al castillo'}. Vamos de a uno.`, tono: 'aviso', punto: planoRef.current?.reposo(enLugar.current) ?? reposoPt }, 8000);
  }

  // al abrir: se ve todo el cielo, la cámara viaja a tu siguiente paso y el personaje camina hasta allá
  const destinoInicial = useCallback((): Ext => {
    const v = vistaRef.current;
    if (v.progreso.total > 0 && v.progreso.completados === v.progreso.total) return 'meta';
    return v.siguiente?.cursoId ?? [...v.nodes].reverse().find((n) => n.status === 'completed')?.cursoId ?? 'inicio';
  }, []);

  const introHecha = useRef<Orientacion | null>(null);
  useEffect(() => {
    if (!plano || caja.w === 0) return;
    const iniciar = () => {
      introHecha.current = plano.orient;
      moverBrote(destinoInicial(), { seguir: plano.orient === 'h', alFinal: () => void revisarCambio() });
    };
    if (plano.orient === 'v') {
      setDuracion(0);
      setCam({ x: 0, y: 0, k: 1 });
      if (introHecha.current === 'v') return;
      const t = window.setTimeout(iniciar, 500);
      return () => window.clearTimeout(t);
    }
    if (introHecha.current === 'h') return;
    setDuracion(0);
    setCam(limitar({ x: 0, y: 0, k: kAjustada() }));
    const t = window.setTimeout(() => {
      const d = destinoInicial();
      if (typeof d === 'number') sobreNodo(d, Math.max(1, kAjustada()), 1100);
      window.setTimeout(iniciar, 500);
    }, 600);
    return () => window.clearTimeout(t);
  }, [plano, caja.w, caja.h, limitar, kAjustada, destinoInicial, moverBrote, revisarCambio, sobreNodo]);

  // si cambia el tamaño de la ventana, la cámara se reacomoda
  useEffect(() => {
    if (plano?.orient === 'h' && introHecha.current === 'h') setCam((c) => limitar(c));
  }, [caja.w, caja.h, plano, limitar]);

  // al aprobar un curso: destello, el personaje salta, camina al siguiente paso y cuenta un dato
  // (las funciones se leen desde una referencia: si cambiaran de identidad a mitad de camino, el efecto se reiniciaría
  // y perdería los temporizadores del paseo)
  const acciones = useRef({ moverBrote, revisarCambio, contarDatoDe });
  acciones.current = { moverBrote, revisarCambio, contarDatoDe };
  const hechosAntes = useRef<Set<number> | null>(null);
  useEffect(() => {
    const ahora = new Set(nodos.filter((n) => n.status === 'completed').map((n) => n.cursoId));
    const antes = hechosAntes.current;
    hechosAntes.current = ahora;
    if (!antes) return;
    const nuevos = [...ahora].filter((id) => !antes.has(id));
    if (nuevos.length === 0) return;
    setBrote(new Set(nuevos));
    setCelebrando(true);
    const t1 = window.setTimeout(() => setBrote(new Set()), 2600);
    const t2 = window.setTimeout(() => setCelebrando(false), 2600);
    const t3 = window.setTimeout(() => {
      const v = vistaRef.current;
      const destino: Ext = v.siguiente?.cursoId ?? (v.progreso.completados === v.progreso.total ? 'meta' : enLugar.current);
      const aprobado = v.nodes.find((n) => n.cursoId === nuevos[0]);
      acciones.current.moverBrote(destino, {
        alFinal: () => {
          const hayCambio = acciones.current.revisarCambio();
          if (!hayCambio && aprobado) acciones.current.contarDatoDe(aprobado);
          else if (aprobado) pendienteDato.current = aprobado;
        },
      });
    }, 900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [nodos]);

  const pendienteDato = useRef<RoadmapNode | null>(null);
  function cerrarCambio() {
    setCambio(null);
    const n = pendienteDato.current;
    pendienteDato.current = null;
    if (n) window.setTimeout(() => contarDatoDe(n), 350);
  }

  // ---- arrastrar, acercar con la rueda (con Ctrl) y pellizcar ---------------------------------------------------
  const punteros = useRef(new Map<number, Pt>());
  const arrastre = useRef<{ x: number; y: number; cam: Cam } | null>(null);
  const pellizco = useRef<{ dist: number; k: number } | null>(null);

  const zoomEn = useCallback(
    (px: number, py: number, factor: number, suave = false) => {
      const c = camRef.current;
      const k2 = limitarK(c.k * factor, Math.min(K_MIN, kAjustada()), K_MAX);
      const r = k2 / c.k;
      const destino = { x: px - (px - c.x) * r, y: py - (py - c.y) * r, k: k2 };
      if (suave) volar(destino, 280);
      else {
        window.clearTimeout(timerSuave.current);
        setDuracion(0);
        setCam(limitar(destino));
      }
    },
    [kAjustada, limitar, volar]
  );

  useEffect(() => {
    const el = contenedor.current;
    if (!el || orient !== 'h') return;
    const alRodar = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return; // sin Ctrl la rueda sigue moviendo la página
      e.preventDefault();
      const r = el.getBoundingClientRect();
      setPistaVista(false);
      zoomEn(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0022));
    };
    el.addEventListener('wheel', alRodar, { passive: false });
    return () => el.removeEventListener('wheel', alRodar);
  }, [orient, zoomEn]);

  function alBajar(e: ReactPointerEvent<HTMLDivElement>) {
    if (orient !== 'h' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movido.current = false;
    if (punteros.current.size === 1) arrastre.current = { x: e.clientX, y: e.clientY, cam: camRef.current };
    else if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      pellizco.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: camRef.current.k };
      arrastre.current = null;
    }
  }

  function alMover(e: ReactPointerEvent<HTMLDivElement>) {
    if (!punteros.current.has(e.pointerId)) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size === 2 && pellizco.current) {
      const [a, b] = [...punteros.current.values()];
      const r = contenedor.current!.getBoundingClientRect();
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const objetivo = pellizco.current.k * (dist / pellizco.current.dist);
      zoomEn((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, objetivo / camRef.current.k);
      movido.current = true;
      return;
    }
    const ini = arrastre.current;
    if (!ini) return;
    const dx = e.clientX - ini.x;
    const dy = e.clientY - ini.y;
    if (!movido.current && Math.hypot(dx, dy) > 5) {
      movido.current = true;
      setAgarrando(true);
      setPistaVista(false);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* algunos navegadores no dejan capturar; el arrastre funciona igual */
      }
    }
    if (movido.current) {
      window.clearTimeout(timerSuave.current);
      setDuracion(0);
      setCam(limitar({ ...ini.cam, x: ini.cam.x + dx, y: ini.cam.y + dy }));
    }
  }

  function alSoltar(e: ReactPointerEvent<HTMLDivElement>) {
    punteros.current.delete(e.pointerId);
    if (punteros.current.size < 2) pellizco.current = null;
    if (punteros.current.size === 0) {
      arrastre.current = null;
      setAgarrando(false);
      window.setTimeout(() => (movido.current = false), 0);
    }
  }

  const haciaMiPaso = useCallback(
    (ms = 900) => {
      const destino = vista.siguiente ?? nodos.find((n) => n.status !== 'completed');
      if (destino) sobreNodo(destino.cursoId, Math.max(1, kAjustada()), ms);
      else verTodo();
    },
    [vista.siguiente, nodos, sobreNodo, kAjustada, verTodo]
  );

  // ---- lo que se ilumina al apuntar a un curso ---------------------------------------------------------------------
  const porId = useMemo(() => new Map(nodos.map((n) => [n.cursoId, n])), [nodos]);
  const foco = sobre ?? selectedId;
  const cadena = useMemo(() => {
    if (foco === null || !porId.has(foco)) return null;
    const hijos = new Map<number, number[]>();
    nodos.forEach((n) => n.prerequisitos.forEach((p) => hijos.set(p.cursoId, [...(hijos.get(p.cursoId) ?? []), n.cursoId])));
    const arriba = new Set<number>();
    const abajo = new Set<number>();
    const subir = (id: number) => porId.get(id)?.prerequisitos.forEach((p) => !arriba.has(p.cursoId) && (arriba.add(p.cursoId), subir(p.cursoId)));
    const bajar = (id: number) => hijos.get(id)?.forEach((h) => !abajo.has(h) && (abajo.add(h), bajar(h)));
    subir(foco);
    bajar(foco);
    return { arriba, abajo };
  }, [foco, porId, nodos]);

  function estadoDeArista(a: Arista): 'hecho' | 'activo' | 'dormido' {
    const origenHecho = a.de === 'inicio' || (typeof a.de === 'number' && porId.get(a.de)?.status === 'completed');
    if (!origenHecho) return 'dormido';
    if (a.a === 'meta') return terminado ? 'hecho' : 'dormido';
    const destino = typeof a.a === 'number' ? porId.get(a.a)?.status : undefined;
    if (destino === 'completed') return 'hecho';
    if (destino === 'current' || destino === 'available') return 'activo';
    return 'dormido';
  }

  function colorDeArista(a: Arista): { color: string; ancho: number; opacidad: number; flujo: boolean; rastro: string } {
    const e = estadoDeArista(a);
    let color = e === 'hecho' ? '#4CE07E' : e === 'activo' ? (typeof a.a === 'number' && porId.get(a.a)?.status === 'current' ? '#F5A524' : noche ? '#5FD3C2' : '#12C2A8') : '#6E8A82';
    let ancho = e === 'dormido' ? 2 : 3;
    let opacidad = e === 'dormido' ? 0.5 : 1;
    let rastro = e === 'hecho' ? 'rgba(76,224,126,0.2)' : e === 'activo' ? 'rgba(245,165,36,0.14)' : 'rgba(246,240,216,0.05)';
    if (cadena && foco !== null) {
      const sube = typeof a.a === 'number' && (cadena.arriba.has(a.a) || a.a === foco) && (a.de === 'inicio' || (typeof a.de === 'number' && cadena.arriba.has(a.de)));
      const baja = typeof a.de === 'number' && (cadena.abajo.has(a.de) || a.de === foco) && (a.a === 'meta' || (typeof a.a === 'number' && cadena.abajo.has(a.a)));
      if (sube || baja) {
        color = sube ? (noche ? '#7EEBD9' : '#0E8A7D') : noche ? '#F8D98B' : '#F5A524';
        ancho = 3.5;
        opacidad = 1;
        rastro = sube ? 'rgba(126,235,217,0.22)' : 'rgba(248,217,139,0.2)';
      } else opacidad = 0.12;
    }
    return { color, ancho, opacidad, flujo: e === 'activo' || (!!cadena && opacidad === 1 && e !== 'dormido'), rastro };
  }

  // ---- dibujo ------------------------------------------------------------------------------------------------------
  if (nodos.length === 0) return null;

  const horizontal = orient === 'h';
  const altoCaja = horizontal ? 'clamp(520px, 74vh, 720px)' : plano ? plano.alto : 420;
  const mostrarEtiquetas = !horizontal || cam.k >= 0.5;
  const nodoSobre = sobre !== null ? porId.get(sobre) : undefined;
  const colocadoSobre = nodoSobre && plano ? plano.colocados.find((c) => c.nodo.cursoId === nodoSobre.cursoId) : undefined;
  const aEnPantalla = (p: Pt) => ({ x: cam.x + p.x * cam.k, y: cam.y + p.y * cam.k });
  const chip = noche ? 'bg-[#07110F]/80 border-white/10 text-[#E6EFE9]' : 'bg-white/85 border-[#0E8A7D]/25 text-[#1F2D2A]';
  const montanas = MONTANAS[tema];

  let tooltip: ReactElement | null = null;
  if (horizontal && nodoSobre && colocadoSobre && !dicho) {
    const { x: sx, y: sy } = aEnPantalla(colocadoSobre);
    const arribaDelNodo = sy > caja.h * 0.55;
    tooltip = (
      <div
        role="tooltip"
        className="gl-fade-up absolute z-30 w-64 pointer-events-none"
        style={{
          left: limitarK(sx, 140, Math.max(140, caja.w - 140)),
          top: arribaDelNodo ? sy - 56 * cam.k : sy + 130 * cam.k,
          transform: `translate(-50%, ${arribaDelNodo ? '-100%' : '0'})`,
        }}
      >
        <div className="rounded-xl bg-[#0B1513]/95 border border-white/10 px-3.5 py-3 shadow-2xl backdrop-blur">
          <p className="text-xs font-bold text-white leading-snug">{nodoSobre.titulo}</p>
          {nodoSobre.razon && <p className="text-[11px] text-[#F5D98B] leading-snug mt-1.5">{nodoSobre.razon}</p>}
          {nodoSobre.temario.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {nodoSobre.temario.slice(0, 3).map((t) => (
                <li key={t} className="text-[11px] text-[#BCC9C2] leading-snug truncate">· {t}</li>
              ))}
              {nodoSobre.temario.length > 3 && <li className="text-[10px] text-[#98B0A6]">y {nodoSobre.temario.length - 3} temas más</li>}
            </ul>
          )}
          {nodoSobre.habilidades.length > 0 && <p className="text-[10px] text-[#7EDCCB] mt-2 leading-snug">Desbloquea: {nodoSobre.habilidades.join(', ')}</p>}
          <p className="text-[10px] font-mono text-[#98B0A6] mt-2">Haz clic: tu personaje camina hasta allá</p>
        </div>
      </div>
    );
  }

  let globo: ReactElement | null = null;
  if (dicho && !caminando) {
    const { x: bx, y: by } = aEnPantalla({ x: dicho.punto.x, y: dicho.punto.y - 60 });
    const sombra = dicho.tono === 'dato' ? 'border-[#F5A524]/50' : 'border-white/15';
    globo = (
      <div
        role="status"
        className="gl-globo absolute z-30 w-64 sm:w-72"
        style={{ left: limitarK(bx, 140, Math.max(140, caja.w - 140)), top: Math.max(by, 120), transform: 'translate(-50%, -100%)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className={`relative rounded-2xl bg-[#0B1513]/96 border ${sombra} px-3.5 py-3 shadow-2xl backdrop-blur`}>
          <button type="button" aria-label="Cerrar" onClick={() => setDicho(null)} className="absolute right-2 top-2 w-6 h-6 rounded-full text-[#98B0A6] hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {dicho.titulo && <p className="pr-6 text-[11px] font-mono font-bold uppercase tracking-wide text-[#F5D98B] leading-snug">{dicho.titulo}</p>}
          <p className={`text-[13px] leading-snug text-[#E6EFE9] ${dicho.titulo ? 'mt-1.5' : 'pr-6'}`}>{dicho.texto}</p>
          {dicho.ingles && (
            <p className="mt-2 text-[12px] leading-snug text-[#7EDCCB]">
              “{dicho.ingles.en}”
              <span className="block text-[11px] text-[#98B0A6]">{dicho.ingles.es}</span>
            </p>
          )}
          {dicho.otro && (
            <button type="button" onClick={alTocarBrote} className="mt-2 text-[11px] font-semibold text-[#7EDCCB] hover:text-white cursor-pointer">
              Otro dato →
            </button>
          )}
          <span className={`absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0B1513] border-r border-b ${sombra}`} />
        </div>
      </div>
    );
  }

  const escala = plano && horizontal ? Math.min(150 / plano.ancho, 84 / plano.alto) : 0;
  // con pocos cursos el mapa entra completo y el minimapa sobra: aparece al acercar o cuando la ruta es larga
  const mapaRecortado = Boolean(plano) && (caja.w / cam.k < (plano?.ancho ?? 0) - 24 || caja.h / cam.k < (plano?.alto ?? 0) - 24);
  const accesoriosIds = apariencia.accesorios.map((a) => a.id);

  return (
    <div
      ref={contenedor}
      role="group"
      aria-label="Mapa de tu roadmap: cada curso es un nodo y las líneas son los requisitos"
      className={`relative w-full overflow-clip rounded-2xl border select-none ${noche ? 'border-[#27403A]' : 'border-[#BFE3D2]'} ${horizontal ? (agarrando ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      style={{ height: altoCaja, touchAction: horizontal ? 'none' : 'auto', background: FONDO[tema] }}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      {/* cielo */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {noche ? (
          <>
            <div className="gl-const-aurora absolute -left-24 -top-24 w-[60%] h-[70%] rounded-full blur-3xl" style={{ background: 'rgba(18,194,168,0.2)' }} />
            <div className="gl-const-aurora absolute -right-20 top-[18%] w-[45%] h-[55%] rounded-full blur-3xl" style={{ background: 'rgba(245,165,36,0.1)', animationDelay: '-6s' }} />
            <div className="absolute inset-0" style={{ backgroundImage: ESTRELLAS_LEJOS, backgroundPosition: `${cam.x * 0.05}px ${cam.y * 0.05}px` }} />
            <div className="absolute inset-0" style={{ backgroundImage: ESTRELLAS_CERCA, backgroundPosition: `${cam.x * 0.12}px ${cam.y * 0.12}px` }} />
            {FIGURAS.map((f, i) => (
              <svg key={i} viewBox="0 0 120 80" className="absolute w-32 opacity-60" style={{ left: f.izq, top: f.arriba, transform: `translate(${cam.x * 0.08}px, ${cam.y * 0.08}px)` }}>
                <polyline points={f.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="rgba(190,230,222,0.3)" strokeWidth={0.8} />
                {f.pts.map((p, j) => (
                  <circle key={j} cx={p[0]} cy={p[1]} r={1.8} fill="#E6EFE9" className="gl-art-spark" style={{ ['--dur' as string]: `${3 + ((i + j) % 4)}s`, animationDelay: `${-j * 0.6}s` }} />
                ))}
              </svg>
            ))}
            {[
              [12, 18, 3.2], [27, 9, 4.1], [44, 22, 2.8], [78, 26, 4.6], [90, 8, 3.1], [35, 40, 3.9], [8, 52, 4.4], [70, 46, 3.3],
            ].map(([l, t, d], i) => (
              <span key={i} className="gl-art-spark absolute rounded-full bg-white" style={{ left: `${l}%`, top: `${t}%`, width: 2.5, height: 2.5, ['--dur' as string]: `${d}s`, animationDelay: `${-i * 0.7}s` }} />
            ))}
            <div className="absolute" style={{ right: horizontal ? 190 : 24, top: horizontal ? 26 : 70, opacity: 0.55, transform: `translate(${cam.x * 0.1}px, ${cam.y * 0.1}px)` }}>
              <svg viewBox="0 0 60 40" width={52} height={34}>
                <ellipse cx={30} cy={20} rx={28} ry={6} fill="none" stroke="#F5D98B" strokeWidth={1.6} transform="rotate(-18 30 20)" opacity={0.7} />
                <circle cx={30} cy={20} r={10} fill="#D98A5B" />
                <circle cx={27} cy={17} r={4} fill="#EFB78A" opacity={0.6} />
              </svg>
            </div>
            <span className="gl-const-shoot absolute h-px w-24 bg-gradient-to-r from-white to-transparent" style={{ top: '9%', right: '14%', ['--dur' as string]: '13s', ['--delay' as string]: '2s' }} />
            <span className="gl-const-shoot absolute h-px w-20 bg-gradient-to-r from-white to-transparent" style={{ top: '26%', right: '46%', ['--dur' as string]: '17s', ['--delay' as string]: '9s' }} />
          </>
        ) : (
          <>
            <div className="absolute rounded-full" style={{ right: horizontal ? 170 : 22, top: horizontal ? 16 : 64, width: 46, height: 46, background: '#FFF3B0', boxShadow: '0 0 60px 18px rgba(255,236,150,0.55)' }} />
            {[
              [8, 14, 0], [34, 8, 5], [62, 20, 2], [84, 10, 7],
            ].map(([l, t, d], i) => (
              <div key={i} className="gl-cloud absolute" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${-d}s` }}>
                <svg viewBox="0 0 90 30" width={88} height={30}>
                  <ellipse cx={45} cy={20} rx={40} ry={9} fill="rgba(255,255,255,0.85)" />
                  <ellipse cx={30} cy={12} rx={20} ry={10} fill="rgba(255,255,255,0.85)" />
                  <ellipse cx={58} cy={10} rx={24} ry={12} fill="rgba(255,255,255,0.85)" />
                </svg>
              </div>
            ))}
          </>
        )}
        <svg
          viewBox="0 0 1600 240"
          preserveAspectRatio="xMidYMax slice"
          className="absolute bottom-0 h-[34%] min-h-[150px] max-h-[230px]"
          style={{ left: '-30%', width: '160%', transform: `translateX(${cam.x * 0.03}px)` }}
        >
          <path d={CORDILLERA.atras} fill={montanas.atras} />
          <path d={CORDILLERA.hierba} fill={montanas.hierba} />
          <path d={CORDILLERA.pinos} fill={montanas.pinos} />
        </svg>
      </div>

      {plano && (
        <>
          {/* el mundo: se mueve y se acerca con la cámara */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: plano.ancho,
              height: plano.alto,
              transformOrigin: '0 0',
              transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`,
              transition: duracion > 0 ? `transform ${duracion}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none',
            }}
          >
            {/* una columna por etapa */}
            {plano.bandas.map((b) => (
              <div
                key={b.index}
                className="absolute rounded-3xl pointer-events-none"
                style={{
                  left: b.x,
                  top: b.y,
                  width: b.w,
                  height: b.h,
                  background: noche
                    ? b.completa
                      ? 'linear-gradient(to bottom, rgba(76,224,126,0.09), rgba(76,224,126,0.02))'
                      : 'linear-gradient(to bottom, rgba(95,211,194,0.07), rgba(95,211,194,0.012))'
                    : b.completa
                      ? 'linear-gradient(to bottom, rgba(76,224,126,0.22), rgba(76,224,126,0.06))'
                      : 'linear-gradient(to bottom, rgba(255,255,255,0.38), rgba(255,255,255,0.12))',
                  border: `1px dashed ${b.completa ? 'rgba(76,224,126,0.4)' : noche ? 'rgba(95,211,194,0.15)' : 'rgba(14,138,125,0.3)'}`,
                }}
              />
            ))}

            {/* las líneas: requisitos, y por dónde ya pasaste */}
            <svg width={plano.ancho} height={plano.alto} className="absolute left-0 top-0 overflow-visible pointer-events-none" aria-hidden="true">
              {plano.aristas.map((a) => {
                const c = colorDeArista(a);
                const e = estadoDeArista(a);
                const dormida = e === 'dormido' && !(cadena && c.opacidad === 1);
                return (
                  <g key={a.id} style={{ opacity: c.opacidad, transition: 'opacity 0.25s ease' }}>
                    {noche ? (
                      <>
                        <path d={a.d} fill="none" stroke={c.rastro} strokeWidth={18} strokeLinecap="round" />
                        {dormida ? (
                          <path d={a.d} fill="none" stroke={c.color} strokeWidth={c.ancho} strokeLinecap="round" strokeDasharray="3 9" />
                        ) : (
                          <>
                            <path d={a.d} fill="none" stroke={c.color} strokeWidth={c.ancho} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${c.color})` }} />
                            {c.flujo && <path d={a.d} fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" className="gl-const-flow" opacity={0.85} />}
                          </>
                        )}
                        {a.brillos.map((p, i) => (
                          <path
                            key={i}
                            d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z"
                            transform={`translate(${p.x} ${p.y}) scale(${e === 'hecho' ? 0.9 : 0.6})`}
                            fill={e === 'hecho' ? '#CFFBE0' : e === 'activo' ? '#FFE3A8' : '#9FB6AF'}
                            opacity={e === 'dormido' ? 0.55 : 0.95}
                            className="gl-art-spark"
                            style={{ ['--dur' as string]: `${2.4 + ((i + a.id.length) % 4) * 0.7}s`, animationDelay: `${-i * 0.9}s` }}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        <path d={a.d} fill="none" stroke="#D2C596" strokeWidth={28} strokeLinecap="round" />
                        <path d={a.d} fill="none" stroke="#F7F0D8" strokeWidth={21} strokeLinecap="round" />
                        {dormida ? (
                          <path d={a.d} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 12" opacity={0.9} />
                        ) : (
                          <>
                            <path d={a.d} fill="none" stroke={c.color} strokeWidth={9} strokeLinecap="round" opacity={0.92} />
                            {c.flujo && <path d={a.d} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" className="gl-const-flow" opacity={0.9} />}
                          </>
                        )}
                      </>
                    )}
                  </g>
                );
              })}

              {/* naves que van y vienen por lo que ya recorriste */}
              {noche && !sinMovimiento &&
                plano.aristas.map((a, i) => {
                  const e = estadoDeArista(a);
                  if (e === 'dormido' || (cadena && colorDeArista(a).opacidad < 1)) return null;
                  return (
                    <g key={`nave-${a.id}`} opacity={0.95}>
                      <animateMotion dur={`${7 + (i % 4) * 1.7}s`} begin={`-${(i * 1.9) % 7}s`} repeatCount="indefinite" rotate="auto" path={a.d} />
                      <path d={NAVE} fill="#E6EFE9" stroke="#9FB0C7" strokeWidth={0.5} />
                      <circle cx={0.8} cy={0} r={1} fill="#5FD3C2" />
                      <path d="M-4.2 -1.3 L-8.6 0 L-4.2 1.3 Z" fill="#F5A524" className="gl-art-spark" style={{ ['--dur' as string]: '0.5s' }} />
                    </g>
                  );
                })}
            </svg>

            {/* rótulos de etapa, por encima de las líneas */}
            {plano.bandas.map((b) => (
              <div key={`r${b.index}`} className={`absolute pointer-events-none px-3 pt-2.5 ${horizontal ? 'text-center' : ''}`} style={{ left: b.x, top: b.y, width: b.w }}>
                <span className="inline-block rounded-xl px-2.5 py-1 text-left" style={{ background: noche ? 'rgba(7,17,15,0.72)' : 'rgba(255,255,255,0.82)' }}>
                  <span className={`block font-mono text-[10px] font-bold uppercase tracking-widest ${b.completa ? (noche ? 'text-[#4CE07E]' : 'text-[#15803D]') : noche ? 'text-[#5FD3C2]/85' : 'text-[#0B6F65]'}`}>
                    Etapa {b.index + 1}{b.completa && ' · completa'}
                  </span>
                  <span className={`block font-display font-bold text-[14px] leading-tight ${noche ? 'text-[#E6EFE9]/90' : 'text-[#1F2D2A]'}`}>{b.nombre}</span>
                </span>
              </div>
            ))}

            {noche ? (
              <>
                <Tierra x={plano.inicio.x} y={plano.inicio.y} uid={uid} />
                <Luna x={plano.meta.x} y={plano.meta.y} encendida={terminado} meta={vista.meta} uid={uid} />
              </>
            ) : (
              <>
                <Casa x={plano.inicio.x} y={plano.inicio.y} horizontal={horizontal} />
                <Castillo x={plano.meta.x} y={plano.meta.y} encendido={terminado} meta={vista.meta} />
              </>
            )}
            <button
              type="button"
              aria-label={noche ? 'La Luna, tu meta' : 'El castillo, tu meta'}
              onClick={() => {
                if (!movido.current) alTocarMeta();
              }}
              className="absolute z-[5] rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{ left: plano.meta.x - 56, top: plano.meta.y - 56, width: 112, height: 112 }}
            />

            {/* los nodos */}
            {plano.colocados.map((c) => {
              const n = c.nodo;
              const est = ESTADO[n.status];
              const estilo = CATEGORY_STYLE[n.categoria];
              const hecho = n.status === 'completed';
              const actual = n.status === 'current';
              const bloqueado = n.status === 'locked' || n.status === 'unavailable';
              const elegido = selectedId === n.cursoId;
              const encendida = !cadena || n.cursoId === foco || cadena.arriba.has(n.cursoId) || cadena.abajo.has(n.cursoId);
              const gid = `${uid}-g${n.cursoId}`;
              const borde = bloqueado && !noche ? '#8FA39B' : est.borde;
              return (
                <div
                  key={n.cursoId}
                  className={`absolute ${sobre === n.cursoId ? 'z-30' : actual ? 'z-20' : 'z-10'}`}
                  style={{ left: c.x - 70, top: c.y - 48, width: 140, opacity: encendida ? 1 : 0.28, transition: 'opacity 0.25s ease' }}
                  onMouseEnter={() => setSobre(n.cursoId)}
                  onMouseLeave={() => setSobre((s) => (s === n.cursoId ? null : s))}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (movido.current) return;
                      onSelect(elegido ? null : n.cursoId);
                      alTocarNodo(n);
                    }}
                    onFocus={() => setSobre(n.cursoId)}
                    onBlur={() => setSobre((s) => (s === n.cursoId ? null : s))}
                    aria-pressed={elegido}
                    aria-label={`Paso ${c.paso}: ${n.titulo}. ${textoDeEstado(n)}`}
                    className="group flex flex-col items-center w-full cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`relative block transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110 ${actual || hecho ? 'gl-const-breath' : ''}`}
                      style={{ width: HEX_W, height: HEX_H, ['--glow' as string]: est.glow, transform: actual ? 'scale(1.1)' : undefined }}
                    >
                      <svg width={HEX_W} height={HEX_H} viewBox={`0 0 ${HEX_W} ${HEX_H}`} aria-hidden="true" className="overflow-visible">
                        <defs>
                          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor={estilo?.from ?? '#0E8A7D'} />
                            <stop offset="1" stopColor={estilo?.to ?? '#12C2A8'} />
                          </linearGradient>
                        </defs>
                        {actual && <polygon points={HEX} fill="none" stroke="#F5A524" strokeWidth={2} className="gl-const-pulse" />}
                        {n.dadoDeBaja && <polygon points={HEX} fill="none" stroke="#F87171" strokeWidth={2} strokeDasharray="5 4" transform="translate(42 48) scale(1.16) translate(-42 -48)" />}
                        {elegido && <polygon points={HEX} fill="none" stroke={noche ? '#FFFFFF' : '#1F2D2A'} strokeWidth={2} transform="translate(42 48) scale(1.18) translate(-42 -48)" opacity={0.9} />}
                        <polygon points={HEX} fill={bloqueado ? (noche ? '#13221F' : '#BCC9C2') : `url(#${gid})`} stroke={borde} strokeWidth={hecho || actual ? 3.5 : 2.5} strokeLinejoin="round" />
                        {!bloqueado && <polygon points={HEX} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1} transform="translate(42 48) scale(0.78) translate(-42 -48)" />}
                        <g transform="translate(30 36)" fill="none" stroke={bloqueado ? (noche ? '#6E8A82' : '#FFFFFF') : '#FFFFFF'}>
                          {estilo?.icon}
                        </g>
                      </svg>

                      <span className={`absolute -left-1 top-0 w-5 h-5 rounded-full border text-[10px] font-mono font-bold flex items-center justify-center ${noche ? 'bg-[#07110F] border-white/20 text-white/80' : 'bg-white border-[#0E8A7D]/30 text-[#1F2D2A]'}`}>{c.paso}</span>
                      {hecho && (
                        <span className={`absolute -right-1 top-0 w-6 h-6 rounded-full bg-[#4CE07E] text-[#0B2A18] flex items-center justify-center shadow-lg ring-2 ${noche ? 'ring-[#07110F]' : 'ring-white'}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                      {bloqueado && (
                        <span className={`absolute -right-1 top-0 w-6 h-6 rounded-full border flex items-center justify-center ring-2 ${noche ? 'bg-[#1B2B28] text-[#8CA39B] border-white/15 ring-[#07110F]' : 'bg-white text-[#5B6B65] border-[#BCC9C2] ring-white'}`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                      )}
                      {actual && (
                        <span className="absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap bg-[#F5A524] text-[#2B1A02] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg gl-bounce">
                          Aquí vas
                          <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#F5A524] rotate-45" />
                        </span>
                      )}

                      {brote.has(n.cursoId) && (
                        <span aria-hidden="true" className="absolute left-1/2 top-1/2 pointer-events-none">
                          <span className="gl-const-burst absolute left-0 top-0 w-24 h-24 rounded-full border-2 border-[#4CE07E]" style={{ boxShadow: '0 0 30px rgba(76,224,126,0.7)' }} />
                          {Array.from({ length: 12 }, (_, i) => (
                            <span
                              key={i}
                              className="gl-const-spark absolute left-0 top-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full"
                              style={{ ['--a' as string]: `${i * 30}deg`, background: i % 3 === 0 ? '#F5D98B' : '#4CE07E' }}
                            />
                          ))}
                        </span>
                      )}
                    </span>

                    <span className={`mt-1.5 block w-[140px] text-center transition-opacity duration-200 ${noche ? '' : 'rounded-xl bg-white/80 px-1.5 py-1 shadow-sm'}`} style={{ opacity: mostrarEtiquetas ? 1 : 0 }}>
                      <span className={`block font-display font-bold text-[12px] leading-[15px] line-clamp-2 ${noche ? 'text-[#E6EFE9] group-hover:text-white' : 'text-[#1F2D2A]'}`}>{n.titulo}</span>
                      <span className={`mt-1 flex items-center justify-center gap-1.5 text-[10.5px] ${noche ? 'text-[#98B0A6]' : 'text-[#4B5E58]'}`}>
                        <Nivel nivel={n.nivel} apagado={noche ? 'bg-white/15' : 'bg-[#1F2D2A]/15'} />
                        {n.horas != null && <span>{n.horas} h</span>}
                      </span>
                      {/* el estado se lee en el color y el ícono del nodo; la etiqueta solo aparece cuando hay algo que atender */}
                      {(actual || n.status === 'unavailable' || n.dadoDeBaja) && (
                        <span
                          className="mt-1 inline-block max-w-full truncate rounded-full px-2 py-px text-[10px] font-semibold align-top"
                          style={
                            n.dadoDeBaja && hecho
                              ? { color: noche ? '#F87171' : '#DC2626', background: 'rgba(248,113,113,0.14)' }
                              : { color: noche ? est.texto : TEXTO_DIA[n.status], background: est.fondo }
                          }
                        >
                          {textoDeEstado(n)}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}

            {/* el personaje */}
            <div ref={broteEl} className="absolute left-0 top-0 z-[26]" style={{ willChange: 'transform' }}>
              <div className={negando ? 'gl-shake' : ''}>
                <button
                  type="button"
                  aria-label="Tu personaje. Tócalo para escuchar un dato curioso"
                  onClick={() => {
                    if (!movido.current) alTocarBrote();
                  }}
                  className="block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-lg"
                  style={{ marginLeft: -23, marginTop: -60 }}
                >
                  <div ref={giroEl} style={{ transformOrigin: '50% 100%' }}>
                    <Brote genero={genero} rango={apariencia.rango} accesorios={accesoriosIds} size={62} camina={caminando} celebra={celebrando} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {tooltip}
          {globo}

          {/* arriba a la izquierda: tu avance y tu personaje (todo lo demás se queda quieto) */}
          <div className="absolute left-3 top-3 z-20" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                aria-expanded={selectorAbierto}
                onClick={() => setSelectorAbierto((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border pl-1 pr-2.5 py-0.5 text-[11px] font-semibold backdrop-blur cursor-pointer transition-colors ${chip} hover:border-[#12C2A8]`}
              >
                <span className="relative block w-6 h-6 overflow-hidden"><span className="absolute left-0 -top-0.5"><Brote genero={genero} rango={apariencia.rango} accesorios={[]} size={30} /></span></span>
                {apariencia.forma}
              </button>
            </div>
            {selectorAbierto && (
              <div className={`mt-1.5 inline-block rounded-2xl border p-2.5 backdrop-blur gl-fade-up ${noche ? 'bg-[#07110F]/92 border-white/10' : 'bg-white/95 border-[#0E8A7D]/25'}`}>
                <p className={`px-1 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider ${noche ? 'text-[#98B0A6]' : 'text-[#5B6B65]'}`}>Tu personaje</p>
                <div className="flex gap-2">
                  {([['ella', 'Ella'], ['el', 'Él']] as [Genero, string][]).map(([g, texto]) => (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={genero === g}
                      onClick={() => {
                        setGenero(g);
                        guardarGenero(g);
                      }}
                      className={`flex flex-col items-center rounded-xl border px-3 pt-2 pb-1.5 cursor-pointer transition-colors ${genero === g ? 'border-[#12C2A8] bg-[#12C2A8]/15' : noche ? 'border-white/10 hover:border-white/30' : 'border-[#E1E6DF] hover:border-[#0E8A7D]/50'}`}
                    >
                      <Brote genero={g} rango={apariencia.rango} accesorios={accesoriosIds} size={64} />
                      <span className={`mt-1 text-[11px] font-semibold ${noche ? 'text-[#E6EFE9]' : 'text-[#1F2D2A]'}`}>{texto}</span>
                    </button>
                  ))}
                </div>
                {apariencia.accesorios.length > 0 && (
                  <p className={`mt-2 px-1 text-[10.5px] leading-snug max-w-[200px] ${noche ? 'text-[#98B0A6]' : 'text-[#5B6B65]'}`}>
                    Lleva {apariencia.accesorios.map((a) => a.nombre).join(', ')}.
                  </p>
                )}
              </div>
            )}
            {horizontal && pistaVista && !selectorAbierto && (
              <p className={`mt-1.5 pl-1 text-[10px] ${noche ? 'text-[#98B0A6]/80' : 'text-[#4B5E58]'}`}>Toca un curso y tu personaje camina hasta allá · arrastra para recorrer</p>
            )}
          </div>

          {/* herramientas: un solo grupo con íconos, en vez de una fila de botones con texto */}
          {(onCambiarTema || horizontal) && (
            <div className="absolute right-3 top-3 z-20" onPointerDown={(e) => e.stopPropagation()}>
              <div
                role="toolbar"
                aria-label="Herramientas del mapa"
                aria-orientation="vertical"
                className={`flex flex-col divide-y overflow-hidden rounded-xl border backdrop-blur ${noche ? 'bg-[#07110F]/85 border-white/10 divide-white/10' : 'bg-white/90 border-[#0E8A7D]/25 divide-[#0E8A7D]/15'}`}
              >
                {onCambiarTema && (
                  <Herramienta noche={noche} titulo={noche ? 'Pasar al día' : 'Pasar a la noche'} onClick={() => onCambiarTema(noche ? 'dia' : 'noche')}>
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      {noche ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10l1.4 1.4M3 12h2m14 0h2M5.6 18.4L7 17M17 7l1.4-1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                      )}
                    </svg>
                  </Herramienta>
                )}
                {horizontal && (
                  <>
                    <Herramienta noche={noche} titulo="Ir a mi paso" onClick={() => haciaMiPaso(900)}>
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <circle cx={12} cy={12} r={3} />
                        <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                      </svg>
                    </Herramienta>
                    <Herramienta noche={noche} titulo="Ver todo el mapa" onClick={verTodo}>
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                      </svg>
                    </Herramienta>
                    <Herramienta noche={noche} titulo="Acercar" onClick={() => zoomEn(caja.w / 2, caja.h / 2, 1.3, true)}>
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </Herramienta>
                    <Herramienta noche={noche} titulo="Alejar" onClick={() => zoomEn(caja.w / 2, caja.h / 2, 1 / 1.3, true)}>
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" d="M5 12h14" />
                      </svg>
                    </Herramienta>
                    <Herramienta noche={noche} titulo="Qué significan los colores" activo={leyendaAbierta} onClick={() => setLeyendaAbierta((v) => !v)}>
                      <span className="text-sm font-bold leading-none" aria-hidden="true">?</span>
                    </Herramienta>
                  </>
                )}
              </div>
            </div>
          )}

          {/* leyenda: solo cuando la persona la pide */}
          {horizontal && leyendaAbierta && (
            <div
              role="note"
              onPointerDown={(e) => e.stopPropagation()}
              className={`absolute right-14 top-3 z-20 rounded-xl border px-3 py-2.5 backdrop-blur gl-fade-up ${noche ? 'bg-[#07110F]/92 border-white/10' : 'bg-white/95 border-[#0E8A7D]/25'}`}
            >
              <ul className="space-y-1.5">
                {([['completed', 'Aprobado'], ['current', 'Tu siguiente paso'], ['available', 'Listo para ti'], ['locked', 'Bloqueado: falta un requisito'], ['unavailable', 'Ya no disponible']] as [NodeStatus, string][]).map(([k, t]) => (
                  <li key={k} className={`flex items-center gap-2 text-[11px] ${noche ? 'text-[#BCC9C2]' : 'text-[#3C4F49]'}`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: k === 'unavailable' ? '#F87171' : !noche && k === 'locked' ? '#8FA39B' : ESTADO[k].borde, boxShadow: noche && k !== 'unavailable' ? `0 0 6px ${ESTADO[k].glow}` : undefined }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* minimapa: solo cuando parte del mapa queda fuera de la vista */}
          {horizontal && mapaRecortado && (
            <>
              <button
                type="button"
                aria-label="Minimapa: haz clic para ir a esa zona"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const wx = (e.clientX - r.left - 6) / escala;
                  const wy = (e.clientY - r.top - 6) / escala;
                  volar({ x: caja.w / 2 - wx * cam.k, y: caja.h / 2 - wy * cam.k, k: cam.k }, 700);
                }}
                className={`absolute right-3 bottom-3 z-20 rounded-lg border backdrop-blur p-1.5 cursor-pointer ${noche ? 'bg-[#07110F]/80 border-white/10 hover:border-white/30' : 'bg-white/85 border-[#0E8A7D]/25 hover:border-[#0E8A7D]'}`}
                style={{ width: plano.ancho * escala + 12, height: plano.alto * escala + 12 }}
              >
                <svg width={plano.ancho * escala} height={plano.alto * escala} className="block" aria-hidden="true">
                  {plano.aristas.map((a) => (
                    <path key={a.id} d={a.d} transform={`scale(${escala})`} fill="none" stroke={colorDeArista(a).color} strokeWidth={4 / escala / 3} opacity={0.5} />
                  ))}
                  {plano.colocados.map((c) => (
                    <circle key={c.nodo.cursoId} cx={c.x * escala} cy={c.y * escala} r={3} fill={!noche && c.nodo.status === 'locked' ? '#8FA39B' : ESTADO[c.nodo.status].borde} />
                  ))}
                  <rect
                    x={(-cam.x / cam.k) * escala}
                    y={(-cam.y / cam.k) * escala}
                    width={(caja.w / cam.k) * escala}
                    height={(caja.h / cam.k) * escala}
                    fill={noche ? 'rgba(255,255,255,0.06)' : 'rgba(14,138,125,0.1)'}
                    stroke={noche ? 'rgba(255,255,255,0.65)' : 'rgba(14,138,125,0.8)'}
                    strokeWidth={1}
                    rx={2}
                  />
                </svg>
              </button>
            </>
          )}
        </>
      )}

      {cambio && <CambioDePersonaje genero={genero} antes={cambio.antes} ahora={cambio.ahora} novedades={cambio.novedades} onCerrar={cerrarCambio} />}
    </div>
  );
}
