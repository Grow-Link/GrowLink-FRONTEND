import type { ReactElement } from 'react';
import { B, S, P, Burbuja, Engranaje, Giro, Lupa, Moneda, Nodo, Panel, estilo } from './escenaBase';

// Una ilustración propia para cada TEMA de curso (Python, bases de datos, redes, integrales, kanban, logística…).
// Se eligen por el título y las habilidades del curso (motivoDe). Si un curso publicado por alguien no encaja en
// ninguno, el catálogo usa la escena de su área (CourseScene). Lienzo de 200 x 100; todo se mueve con CSS.

type Motivo = (p: { acc: string }) => ReactElement;

const mono = { fontFamily: 'ui-monospace, monospace', fontWeight: 700 } as const;
const serif = { fontFamily: 'Georgia, serif', fontWeight: 700 } as const;

function Serpiente({ acc, x, y, s = 1 }: { acc: string; x: number; y: number; s?: number }) {
  return (
    <g className="gl-esc-flota" style={estilo('5s')} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 24 C 16 -10, 36 40, 54 8 S 80 -8, 86 8" fill="none" stroke={B} strokeWidth={9} strokeLinecap="round" />
      <path d="M0 24 C 16 -10, 36 40, 54 8 S 80 -8, 86 8" fill="none" stroke={acc} strokeWidth={3} strokeLinecap="round" strokeDasharray="1 11" />
      <circle cx={86} cy={8} r={7} fill={B} />
      <circle cx={88} cy={6} r={1.8} fill="#10302A" />
      <path d="M92 10 l7 3 m-7 -3 l7 -4" stroke={acc} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

function Python({ acc }: { acc: string }) {
  return (
    <>
      <Panel x={14} y={14} w={78} h={40}>
        <circle cx={22} cy={22} r={2} fill="#F2704E" />
        <circle cx={29} cy={22} r={2} fill="#F5A524" />
        <circle cx={36} cy={22} r={2} fill="#4CE07E" />
        <text x={22} y={37} fontSize={9.5} {...mono} fill={B}>{'>>> 2 + 2'}</text>
        <text x={22} y={48} fontSize={9.5} {...mono} fill={acc}>4</text>
      </Panel>
      <Serpiente acc={acc} x={86} y={52} />
      <text x={16} y={80} fontSize={11} {...mono} fill={acc} className="gl-esc-flota" style={estilo('4s', -1)}>print()</text>
    </>
  );
}

function PythonAuto({ acc }: { acc: string }) {
  return (
    <>
      <Engranaje x={48} y={52} r={19} n={9} dur="10s" />
      <Engranaje x={82} y={30} r={10} n={6} dur="10s" inverso relleno={acc} />
      <Giro x={48} y={52} dur="9s">
        <path d="M0 -32 A32 32 0 1 1 -28 -16" fill="none" stroke={S} strokeWidth={2.2} strokeLinecap="round" />
        <path d="M-33 -22 L-26 -12 L-35 -10 Z" fill={B} />
      </Giro>
      <Panel x={112} y={20} w={70} h={50}>
        <rect x={112} y={20} width={70} height={11} rx={5} fill="rgba(255,255,255,0.2)" />
        {[36, 46, 56].map((y, i) => (
          <g key={y}>
            <rect x={118} y={y} width={16} height={5} rx={2} fill={i === 1 ? acc : B} opacity={0.85} />
            <rect x={140} y={y} width={12} height={5} rx={2} fill={B} opacity={0.6} />
            <rect x={158} y={y} width={16} height={5} rx={2} fill={B} opacity={0.6} />
          </g>
        ))}
      </Panel>
      <text x={114} y={86} fontSize={10} {...mono} fill={B} className="gl-esc-flota" style={estilo('3.6s')}>.csv → .py</text>
    </>
  );
}

function DatosPython({ acc }: { acc: string }) {
  return (
    <>
      <Panel x={14} y={18} w={62} h={52}>
        <rect x={14} y={18} width={62} height={11} rx={5} fill={acc} opacity={0.9} />
        {[34, 43, 52, 61].map((y) => (
          <path key={y} d={`M20 ${y} H70`} stroke={B} strokeWidth={2.4} strokeLinecap="round" opacity={0.75} />
        ))}
        <path d="M45 29 V68" stroke={S} />
      </Panel>
      {[24, 38, 30, 52].map((h, i) => (
        <rect key={i} className="gl-esc-barra" x={96 + i * 18} y={74 - h} width={12} height={h} rx={3} fill={i === 3 ? acc : B} style={estilo('3s', -i * 0.4)} />
      ))}
      <path d="M92 76 H170" stroke={S} strokeWidth={2} strokeLinecap="round" />
      <Lupa x={170} y={28} />
      <text x={96} y={20} fontSize={10} {...mono} fill={B}>df.plot()</text>
    </>
  );
}

function PythonAvanzado({ acc }: { acc: string }) {
  return (
    <>
      <Serpiente acc={acc} x={14} y={60} s={0.7} />
      <path className="gl-esc-pulso" d="M108 14 L94 46 H108 L98 82" fill="none" stroke="#FBBF24" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" style={estilo('1.8s')} />
      <Panel x={126} y={18} w={60} h={52}>
        {[26, 40, 54].map((y, i) => (
          <g key={y}>
            <rect x={132} y={y - 5} width={9} height={9} rx={2} fill={i === 2 ? 'none' : acc} stroke={B} strokeWidth={1.4} />
            {i < 2 && <path d={`M134 ${y - 1} l2 2.4 l4 -5`} stroke="#10302A" strokeWidth={1.4} fill="none" strokeLinecap="round" />}
            <rect x={146} y={y - 2} width={30 - i * 5} height={4} rx={2} fill={B} opacity={0.7} />
          </g>
        ))}
      </Panel>
      <text x={20} y={90} fontSize={10} {...mono} fill={B} className="gl-esc-flota" style={estilo('4s', -1)}>async / await</text>
    </>
  );
}

function Fundamentos({ acc }: { acc: string }) {
  return (
    <>
      <rect x={28} y={12} width={52} height={15} rx={7.5} fill={B} />
      <path d="M54 27 V38" stroke={B} strokeWidth={2} />
      <path d="M54 52 m-18 0 l18 -14 l18 14 l-18 14 Z" fill="none" stroke={B} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M54 66 V76" stroke={B} strokeWidth={2} />
      <rect x={28} y={76} width={52} height={14} rx={3} fill={acc} />
      <path d="M72 52 H98" stroke={B} strokeWidth={2} strokeDasharray="3 3" />
      <g className="gl-esc-flota" style={estilo('4.4s')} transform="translate(140 50)">
        <ellipse rx={15} ry={11} fill={acc} />
        <circle cx={-16} cy={0} r={6} fill={B} />
        <path d="M-4 -10 V10 M5 -9 V9" stroke="rgba(0,0,0,0.22)" strokeWidth={2} />
        <path d="M-9 -9 l-8 -8 M-9 9 l-8 8 M2 -11 l0 -9 M2 11 l0 9 M10 -8 l8 -8 M10 8 l8 8" stroke={B} strokeWidth={2} strokeLinecap="round" />
        <path d="M-20 -4 l-8 -7 M-20 4 l-8 7" stroke={B} strokeWidth={1.6} strokeLinecap="round" />
      </g>
      <text x={110} y={88} fontSize={10} {...mono} fill={B}>if (bug) fix();</text>
    </>
  );
}

function Cubo({ x, y, s, relleno }: { x: number; y: number; s: number; relleno: string }) {
  return (
    <g>
      <path d={`M${x} ${y} L${x + s} ${y + s / 2} L${x} ${y + s} L${x - s} ${y + s / 2} Z`} fill={relleno} />
      <path d={`M${x - s} ${y + s / 2} L${x} ${y + s} L${x} ${y + 2 * s} L${x - s} ${y + 1.5 * s} Z`} fill={relleno} opacity={0.62} />
      <path d={`M${x + s} ${y + s / 2} L${x} ${y + s} L${x} ${y + 2 * s} L${x + s} ${y + 1.5 * s} Z`} fill={relleno} opacity={0.38} />
    </g>
  );
}

function Poo({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <Cubo x={100} y={10} s={12} relleno={B} />
      </g>
      <path d="M100 44 V52 M100 52 H58 V58 M100 52 H142 V58" fill="none" stroke={B} strokeWidth={2} strokeLinejoin="round" />
      <path d="M95 44 L100 38 L105 44 Z" fill="none" stroke={B} strokeWidth={1.8} />
      <g className="gl-esc-flota" style={estilo('4.2s', -1)}>
        <Cubo x={58} y={58} s={11} relleno={acc} />
      </g>
      <g className="gl-esc-flota" style={estilo('4.8s', -2)}>
        <Cubo x={142} y={58} s={11} relleno={B} />
      </g>
      <text x={14} y={22} fontSize={10} {...mono} fill={B}>class</text>
      <text x={160} y={22} fontSize={10} {...mono} fill={acc}>extends</text>
    </>
  );
}

function Cilindro({ x, y, w, h, relleno, franjas = 2 }: { x: number; y: number; w: number; h: number; relleno: string; franjas?: number }) {
  const ry = w * 0.2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={relleno} />
      <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={ry} fill={relleno} />
      {Array.from({ length: franjas }, (_, i) => (
        <path key={i} d={`M${x} ${y + ((i + 1) * h) / (franjas + 1)} a${w / 2} ${ry} 0 0 0 ${w} 0`} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1.6} />
      ))}
      <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={ry} fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.12)" />
    </g>
  );
}

function BasesDeDatos({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <Cilindro x={26} y={26} w={46} h={42} relleno={B} />
      </g>
      <g className="gl-esc-flota" style={estilo('4s', -1.5)}>
        <Cilindro x={84} y={46} w={30} h={28} relleno={acc} franjas={1} />
      </g>
      <Panel x={128} y={18} w={58} h={48}>
        <rect x={128} y={18} width={58} height={10} rx={5} fill="rgba(255,255,255,0.22)" />
        <path d="M128 40 H186 M128 52 H186 M150 28 V66 M168 28 V66" stroke={S} />
        <rect x={132} y={42} width={14} height={7} rx={2} fill={acc} />
      </Panel>
      <text x={130} y={84} fontSize={10} {...mono} fill={B}>SELECT *</text>
      <path d="M74 52 H82" stroke={B} strokeWidth={2} strokeDasharray="2 3" className="gl-esc-flujo" />
    </>
  );
}

function Redes({ acc }: { acc: string }) {
  const puntas: [number, number][] = [[36, 26], [100, 12], [164, 26], [48, 80], [152, 80]];
  return (
    <>
      {puntas.map(([x, y], i) => (
        <g key={i}>
          <path d={`M100 52 L${x} ${y}`} stroke={S} strokeWidth={2} />
          <path d={`M100 52 L${x} ${y}`} stroke={acc} strokeWidth={2.4} className="gl-esc-flujo" style={{ animationDelay: `${-i * 0.35}s` }} />
          <Nodo x={x} y={y} r={7} />
          <rect x={x - 3.5} y={y - 3} width={7} height={5} rx={1} fill="rgba(8,30,28,0.5)" />
        </g>
      ))}
      <Nodo x={100} y={52} r={11} relleno={acc} />
      <path d="M94 52 a7 7 0 0 1 12 0 M97 56 a3 3 0 0 1 6 0" fill="none" stroke="#10302A" strokeWidth={1.8} strokeLinecap="round" />
    </>
  );
}

function Estructuras({ acc }: { acc: string }) {
  const hojas: [number, number][] = [[48, 70], [84, 70], [116, 70], [152, 70]];
  return (
    <>
      <path d="M100 20 L66 44 M100 20 L134 44 M66 44 L48 70 M66 44 L84 70 M134 44 L116 70 M134 44 L152 70" stroke={S} strokeWidth={2} />
      <Nodo x={100} y={20} r={8} />
      <Nodo x={66} y={44} r={7} />
      <Nodo x={134} y={44} r={7} />
      {hojas.map(([x, y], i) => (
        <Nodo key={i} x={x} y={y} r={6.5} relleno={i === 1 ? acc : B} pulso={i === 1} />
      ))}
      <g className="gl-esc-flota" style={estilo('4s')}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={14 + i * 13} y={14} width={12} height={11} rx={2} fill={i === 2 ? acc : P} stroke={B} strokeWidth={1.2} />
        ))}
      </g>
    </>
  );
}

function Web({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <Panel x={14} y={16} w={96} h={60}>
          <rect x={14} y={16} width={96} height={13} rx={5} fill="rgba(255,255,255,0.2)" />
          <circle cx={22} cy={22.5} r={2} fill="#F2704E" />
          <circle cx={29} cy={22.5} r={2} fill="#F5A524" />
          <circle cx={36} cy={22.5} r={2} fill="#4CE07E" />
          <rect x={44} y={19} width={58} height={7} rx={3.5} fill={P} />
          <rect x={20} y={35} width={36} height={24} rx={3} fill={acc} opacity={0.9} />
          <path d="M62 38 H100 M62 46 H94 M62 54 H98 M20 66 H100" stroke={B} strokeWidth={2.4} strokeLinecap="round" opacity={0.75} />
        </Panel>
      </g>
      <path d="M112 46 H134" stroke={acc} strokeWidth={3} strokeLinecap="round" className="gl-esc-flujo" />
      <Panel x={136} y={20} w={42} h={56}>
        {[26, 42, 58].map((y, i) => (
          <g key={y}>
            <rect x={141} y={y} width={32} height={11} rx={2.5} fill="rgba(255,255,255,0.18)" stroke={S} />
            <circle className="gl-esc-pulso" cx={167} cy={y + 5.5} r={2.2} fill={i === 1 ? acc : '#4CE07E'} style={estilo('1.6s', -i * 0.5)} />
          </g>
        ))}
      </Panel>
      <text x={20} y={90} fontSize={10} {...mono} fill={B}>{'GET /api/{id}'}</text>
    </>
  );
}

function Nube({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <path d="M34 62 a14 14 0 0 1 3-27 a20 20 0 0 1 38-5 a16 16 0 0 1 10 32 Z" fill={B} />
        <path d="M54 50 V72 M54 72 l-6 -7 M54 72 l6 -7" stroke={acc} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M70 70 V50 M70 50 l-6 7 M70 50 l6 7" stroke="#10302A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.55} />
      </g>
      <path d="M126 58 C 126 44, 146 44, 156 58 C 166 72, 186 72, 186 58 C 186 44, 166 44, 156 58 C 146 72, 126 72, 126 58 Z" fill="none" stroke={B} strokeWidth={4} />
      <path d="M126 58 C 126 44, 146 44, 156 58 C 166 72, 186 72, 186 58 C 186 44, 166 44, 156 58 C 146 72, 126 72, 126 58 Z" fill="none" stroke={acc} strokeWidth={4} className="gl-esc-flujo" style={{ strokeDasharray: '6 40' }} />
      <text x={134} y={90} fontSize={9.5} {...mono} fill={B}>build · deploy</text>
    </>
  );
}

function Arquitectura({ acc }: { acc: string }) {
  const capas: [number, number, number, string, string][] = [
    [40, 14, 120, B, 'UI'],
    [28, 36, 144, acc, 'API'],
    [20, 58, 160, B, 'DATOS'],
  ];
  return (
    <>
      <path d="M100 30 V36 M100 52 V58" stroke={B} strokeWidth={2} strokeDasharray="2 3" />
      {capas.map(([x, y, w, color, txt], i) => (
        <g key={txt} className="gl-esc-flota" style={estilo('5s', -i * 0.7)}>
          <rect x={x} y={y} width={w} height={18} rx={5} fill={color} opacity={i === 2 ? 0.85 : 1} />
          <text x={100} y={y + 12.5} textAnchor="middle" fontSize={9.5} {...mono} fill="rgba(8,50,46,0.92)">{txt}</text>
        </g>
      ))}
      <Engranaje x={34} y={84} r={7} n={6} dur="8s" />
      <Engranaje x={166} y={84} r={7} n={6} dur="8s" inverso relleno={acc} />
      <path d="M50 86 H150" stroke={S} strokeWidth={1.6} strokeDasharray="3 4" />
    </>
  );
}

function InteligenciaArtificial({ acc }: { acc: string }) {
  const capas: number[][] = [
    [26, 52, 78],
    [20, 40, 62, 82],
    [20, 40, 62, 82],
    [38, 66],
  ];
  const xs = [34, 78, 122, 166];
  return (
    <>
      {capas.slice(0, -1).map((c, i) =>
        c.flatMap((y1) => capas[i + 1].map((y2) => <path key={`${i}-${y1}-${y2}`} d={`M${xs[i]} ${y1} L${xs[i + 1]} ${y2}`} stroke={S} strokeWidth={1.1} />))
      )}
      {capas.map((c, i) => c.map((y, j) => <Nodo key={`${i}-${j}`} x={xs[i]} y={y} r={5.4} relleno={(i + j) % 3 === 0 ? acc : B} pulso={(i + j) % 3 === 0} retraso={-(i * 0.4 + j * 0.25)} />))}
      <path className="gl-esc-pulso" d="M100 8 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill="#FFF3B0" style={estilo('2s')} />
    </>
  );
}

function Distribuidos({ acc }: { acc: string }) {
  const pts = Array.from({ length: 6 }, (_, i) => [100 + 30 * Math.cos((i / 6) * Math.PI * 2 - Math.PI / 2), 52 + 30 * Math.sin((i / 6) * Math.PI * 2 - Math.PI / 2)] as [number, number]);
  return (
    <>
      <Giro x={100} y={52} dur="16s">
        <circle r={30} fill="none" stroke={S} strokeWidth={1.6} strokeDasharray="4 5" />
      </Giro>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <path d={`M100 52 L${x.toFixed(1)} ${y.toFixed(1)}`} stroke={S} strokeWidth={1.4} />
          <rect x={x - 7} y={y - 5.5} width={14} height={11} rx={2.5} fill={i % 2 ? B : acc} className="gl-esc-pulso" style={estilo('2.4s', -i * 0.4)} />
        </g>
      ))}
      <Nodo x={100} y={52} r={6} relleno="#FBBF24" />
      <g transform="translate(26 30)">
        <circle r={13} fill={P} stroke={B} strokeWidth={1.8} />
        <Giro x={0} y={0} dur="6s"><path d="M0 0 V-9" stroke={B} strokeWidth={2} strokeLinecap="round" /></Giro>
        <path d="M0 0 H6" stroke={acc} strokeWidth={2} strokeLinecap="round" />
      </g>
    </>
  );
}

function Discretas({ acc }: { acc: string }) {
  const g: [number, number][] = [[26, 28], [60, 18], [76, 54], [36, 70], [100, 36]];
  return (
    <>
      <path d="M26 28 L60 18 M60 18 L76 54 M76 54 L36 70 M26 28 L36 70 M60 18 L100 36 M76 54 L100 36" stroke={S} strokeWidth={2} />
      {g.map(([x, y], i) => (
        <Nodo key={i} x={x} y={y} r={6} relleno={i === 2 ? acc : B} pulso={i === 2} />
      ))}
      <g className="gl-esc-flota" style={estilo('5s')}>
        <circle cx={140} cy={46} r={22} fill="rgba(255,255,255,0.35)" stroke={B} strokeWidth={2} />
        <circle cx={162} cy={46} r={22} fill={acc} opacity={0.5} stroke={B} strokeWidth={2} />
        <text x={151} y={51} textAnchor="middle" fontSize={15} {...serif} fill="rgba(8,50,46,0.9)">∩</text>
      </g>
      <text x={122} y={86} fontSize={11} {...mono} fill={B}>{'A ∪ B'}</text>
    </>
  );
}

function Derivada({ acc }: { acc: string }) {
  return (
    <>
      <path d="M22 12 V84 M14 78 H184" stroke={S} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M26 74 C 54 74, 70 18, 100 22 S 150 82, 178 50" fill="none" stroke={B} strokeWidth={3.2} strokeLinecap="round" />
      <g className="gl-esc-flota" style={estilo('4s')}>
        <path d="M72 38 L128 20" stroke={acc} strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={100} cy={29} r={4.4} fill={acc} />
      </g>
      <text x={134} y={44} fontSize={15} {...serif} fill={B}>dy/dx</text>
      <text x={34} y={30} fontSize={12} {...serif} fill={acc}>f′(x)</text>
    </>
  );
}

function Integral({ acc }: { acc: string }) {
  return (
    <>
      <path d="M26 78 H184 M26 12 V78" stroke={S} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M52 78 L52 58 C 70 28, 94 24, 114 40 S 140 62, 160 38 L160 78 Z" fill={acc} opacity={0.5} />
      <path d="M32 62 C 52 52, 70 28, 94 26 S 140 66, 178 34" fill="none" stroke={B} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M52 78 V58 M160 78 V38" stroke={B} strokeWidth={1.6} strokeDasharray="3 3" />
      <text x={34} y={50} fontSize={34} {...serif} fill={B} className="gl-esc-flota" style={estilo('4.4s')}>∫</text>
      <text x={168} y={92} fontSize={11} {...serif} fill={B}>dx</text>
    </>
  );
}

function Dado({ x, y, puntos, giro, acc }: { x: number; y: number; puntos: [number, number][]; giro: number; acc: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <rect x={-11} y={-11} width={22} height={22} rx={4} fill={B} />
      {puntos.map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={2.2} fill={i === 0 ? acc : '#10302A'} />
      ))}
    </g>
  );
}

function Estadistica({ acc }: { acc: string }) {
  return (
    <>
      <path d="M16 82 H120" stroke={S} strokeWidth={1.6} />
      <path d="M18 82 C 46 82, 56 22, 68 22 S 92 82, 118 82 Z" fill={acc} opacity={0.4} />
      <path d="M18 82 C 46 82, 56 22, 68 22 S 92 82, 118 82" fill="none" stroke={B} strokeWidth={3} strokeLinecap="round" />
      <path d="M68 18 V82" stroke={B} strokeWidth={1.4} strokeDasharray="3 3" />
      <text x={74} y={34} fontSize={14} {...serif} fill={B}>σ</text>
      <g className="gl-esc-flota" style={estilo('3.6s')}>
        <Dado x={146} y={32} puntos={[[0, 0]]} giro={-12} acc={acc} />
        <Dado x={172} y={58} puntos={[[-5, -5], [5, 5], [0, 0], [-5, 5], [5, -5]]} giro={14} acc={acc} />
      </g>
      <text x={128} y={88} fontSize={11} {...serif} fill={B}>P(A) = 1/6</text>
    </>
  );
}

function Matrices({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <path d="M44 16 H34 V80 H44 M120 16 H130 V80 H120" fill="none" stroke={B} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2].map((f) =>
          [0, 1, 2].map((c) => (
            <text key={`${f}${c}`} x={54 + c * 26} y={36 + f * 22} fontSize={15} {...serif} fill={f === c ? acc : B} textAnchor="middle">
              {f === c ? '1' : '0'}
            </text>
          ))
        )}
      </g>
      <g transform="translate(160 76)">
        <Giro x={0} y={0} dur="14s">
          <path d="M0 0 L22 -30" stroke={B} strokeWidth={3} strokeLinecap="round" />
          <path d="M22 -30 l-7 3 M22 -30 l-1 7" stroke={B} strokeWidth={3} strokeLinecap="round" />
          <path d="M0 0 L-24 -12" stroke={acc} strokeWidth={3} strokeLinecap="round" />
        </Giro>
      </g>
    </>
  );
}

function Contabilidad({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <path d="M14 24 L66 20 V78 L14 82 Z" fill={B} opacity={0.95} />
        <path d="M66 20 L118 24 V82 L66 78 Z" fill={B} opacity={0.75} />
        <path d="M22 34 H58 M22 44 H58 M22 54 H58 M22 64 H58 M74 34 H110 M74 44 H110 M74 54 H110" stroke="rgba(8,50,46,0.35)" strokeWidth={2} strokeLinecap="round" />
        <path d="M44 28 V74" stroke={acc} strokeWidth={2} />
        <path d="M66 20 V78" stroke="rgba(8,50,46,0.3)" />
      </g>
      <g className="gl-esc-flota" style={estilo('4s', -1.2)}>
        <rect x={134} y={22} width={38} height={54} rx={5} fill={P} stroke={B} strokeWidth={1.8} />
        <rect x={139} y={27} width={28} height={11} rx={2} fill={acc} />
        {[0, 1, 2].map((f) => [0, 1, 2].map((c) => <rect key={`${f}${c}`} x={140 + c * 10} y={44 + f * 10} width={7} height={7} rx={1.5} fill={B} opacity={0.85} />))}
      </g>
      <Moneda x={124} y={86} r={6} dur="3.2s" />
    </>
  );
}

function Finanzas({ acc }: { acc: string }) {
  return (
    <>
      <path d="M18 82 H122 M18 16 V82" stroke={S} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M22 70 L44 56 L64 62 L88 38 L116 22 V82 H22 Z" fill={acc} opacity={0.32} />
      <path d="M22 70 L44 56 L64 62 L88 38 L116 22" fill="none" stroke={B} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M106 20 L117 21 L114 32" fill="none" stroke={B} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <g className="gl-esc-flota" style={estilo('4s')}>
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={152} cy={78 - i * 9} rx={15} ry={5.5} fill="#FBBF24" stroke="rgba(0,0,0,0.15)" />
        ))}
      </g>
      <Moneda x={168} y={28} r={9} />
      <text x={134} y={34} fontSize={14} {...serif} fill={B}>%</text>
    </>
  );
}

function Agil({ acc }: { acc: string }) {
  const columnas = [
    { x: 12, filas: [0, 1, 2] },
    { x: 68, filas: [0, 1] },
    { x: 124, filas: [0] },
  ];
  return (
    <>
      {columnas.map((c, ci) => (
        <Panel key={c.x} x={c.x} y={14} w={52} h={70}>
          <rect x={c.x + 6} y={19} width={24} height={4} rx={2} fill={B} opacity={0.8} />
          {c.filas.map((f) => (
            <g key={f} className={ci === 1 && f === 0 ? 'gl-esc-flota' : undefined} style={ci === 1 && f === 0 ? estilo('3s') : undefined}>
              <rect x={c.x + 6} y={30 + f * 17} width={40} height={13} rx={3} fill={(ci + f) % 3 === 0 ? acc : B} opacity={0.92} />
              <rect x={c.x + 10} y={34 + f * 17} width={20} height={3} rx={1.5} fill="rgba(8,50,46,0.45)" />
            </g>
          ))}
        </Panel>
      ))}
      <Giro x={168} y={52} dur="8s">
        <path d="M0 -18 A18 18 0 1 1 -16 -8" fill="none" stroke={B} strokeWidth={3} strokeLinecap="round" />
        <path d="M-20 -14 L-14 -5 L-23 -3 Z" fill={B} />
      </Giro>
      <text x={160} y={90} fontSize={9.5} {...mono} fill={B}>sprint</text>
    </>
  );
}

function Persona({ x, y, r, relleno }: { x: number; y: number; r: number; relleno: string }) {
  return (
    <g>
      <circle cx={x} cy={y - r * 0.9} r={r * 0.55} fill={relleno} />
      <path d={`M${x - r} ${y + r * 0.9} a${r} ${r} 0 0 1 ${r * 2} 0 Z`} fill={relleno} />
    </g>
  );
}

function Liderazgo({ acc }: { acc: string }) {
  const orbita: [number, number][] = [[48, 28], [152, 28], [40, 72], [160, 72]];
  return (
    <>
      <Giro x={100} y={52} dur="22s">
        <circle r={50} fill="none" stroke={S} strokeWidth={1.4} strokeDasharray="3 6" />
      </Giro>
      {orbita.map(([x, y], i) => (
        <g key={i}>
          <path d={`M100 52 L${x} ${y}`} stroke={S} strokeWidth={1.4} strokeDasharray="3 4" />
          <g className="gl-esc-flota" style={estilo('4s', -i * 0.8)}>
            <Persona x={x} y={y + 4} r={9} relleno={B} />
          </g>
        </g>
      ))}
      <g className="gl-esc-flota" style={estilo('3.6s')}>
        <Persona x={100} y={64} r={16} relleno={acc} />
        <path d="M100 8 l3.6 7.4 l8 1.2 l-5.8 5.6 l1.4 8 l-7.2 -3.8 l-7.2 3.8 l1.4 -8 l-5.8 -5.6 l8 -1.2 Z" fill="#FBBF24" />
      </g>
    </>
  );
}

function Emprendimiento({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('3s')} transform="translate(64 14) rotate(18 30 40)">
        <path d="M30 0 C 44 14, 46 36, 40 56 H20 C14 36, 16 14, 30 0 Z" fill={B} />
        <circle cx={30} cy={26} r={6.4} fill={acc} stroke="rgba(0,0,0,0.15)" strokeWidth={1.4} />
        <path d="M20 44 L8 60 L20 56 Z M40 44 L52 60 L40 56 Z" fill={acc} />
        <path className="gl-esc-pulso" d="M24 58 Q30 78 36 58 Z" fill="#FBBF24" style={estilo('0.6s')} />
      </g>
      <g className="gl-esc-flota" style={estilo('4s', -1)} transform="translate(148 30)">
        <circle r={14} fill="#FDE68A" stroke="rgba(0,0,0,0.12)" />
        <rect x={-6} y={14} width={12} height={7} rx={2} fill={B} />
        <path d="M-4 24 H4" stroke={B} strokeWidth={2.4} strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} className="gl-esc-pulso" d="M0 -19 V-25" stroke="#FBBF24" strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${-72 + i * 36})`} style={estilo('1.8s', -i * 0.3)} />
        ))}
      </g>
      {[[20, 24], [36, 76], [110, 16], [96, 84]].map(([x, y], i) => (
        <path key={i} className="gl-esc-pulso" d={`M${x} ${y - 4} l1.2 2.8 l2.8 1.2 l-2.8 1.2 l-1.2 2.8 l-1.2 -2.8 l-2.8 -1.2 l2.8 -1.2 Z`} fill="#FFF3B0" style={estilo('2.2s', -i * 0.5)} />
      ))}
    </>
  );
}

function Ingles({ acc, nivel, a, b, icono }: { acc: string; nivel: string; a: string; b: string; icono: 'codigo' | 'calendario' | 'grafico' }) {
  return (
    <>
      <Burbuja x={22} y={14} w={86} h={24} texto={a} dur="3.6s" tam={13} />
      <Burbuja x={90} y={50} w={88} h={24} texto={b} relleno={acc} color="rgba(255,255,255,0.97)" dur="4.2s" retraso={-1.4} tam={13} />
      <g className="gl-esc-flota" style={estilo('4s', -0.6)} transform="translate(152 24)">
        <circle r={17} fill={P} stroke={B} strokeWidth={2} />
        <text y={5} textAnchor="middle" fontSize={14} fontWeight={800} fill={B} fontFamily="system-ui, sans-serif">{nivel}</text>
      </g>
      <g transform="translate(34 70)" className="gl-esc-flota" style={estilo('4.6s', -2)}>
        {icono === 'codigo' && <text fontSize={14} {...mono} fill={B}>{'</>'}</text>}
        {icono === 'calendario' && (
          <g>
            <rect x={0} y={0} width={24} height={20} rx={3} fill={B} />
            <rect x={0} y={0} width={24} height={6} rx={3} fill={acc} />
            <path d="M5 11 H9 M11 11 H15 M17 11 H20 M5 16 H9 M11 16 H15" stroke="rgba(8,50,46,0.5)" strokeWidth={2} strokeLinecap="round" />
          </g>
        )}
        {icono === 'grafico' && (
          <g>
            {[8, 14, 20].map((h, i) => (
              <rect key={i} x={i * 9} y={22 - h} width={6} height={h} rx={1.5} fill={i === 2 ? acc : B} />
            ))}
          </g>
        )}
      </g>
    </>
  );
}

const InglesA2: Motivo = ({ acc }) => <Ingles acc={acc} nivel="A2" a="Hello!" b="How are you?" icono="codigo" />;
const InglesB1: Motivo = ({ acc }) => <Ingles acc={acc} nivel="B1" a="Let's talk" b="See you at 3" icono="calendario" />;
const InglesB2: Motivo = ({ acc }) => <Ingles acc={acc} nivel="B2" a="Our proposal" b="Q3 results" icono="grafico" />;

function Escritura({ acc }: { acc: string }) {
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <rect x={34} y={12} width={78} height={78} rx={5} fill={B} />
        <rect x={42} y={20} width={34} height={6} rx={3} fill={acc} />
        <path d="M42 36 H104 M42 46 H104 M42 56 H98 M42 66 H88 M42 76 H100" stroke="rgba(8,50,46,0.32)" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <g className="gl-esc-flota" style={estilo('3s', -1)} transform="translate(116 66) rotate(-40)">
        <rect x={0} y={-3.5} width={46} height={7} rx={2} fill={acc} />
        <path d="M0 -3.5 L-9 0 L0 3.5 Z" fill={B} />
        <rect x={34} y={-3.5} width={6} height={7} fill="rgba(0,0,0,0.18)" />
      </g>
      <text x={146} y={34} fontSize={34} {...serif} fill={B}>“</text>
      <path d="M118 80 C 126 74, 132 86, 142 80" fill="none" stroke={acc} strokeWidth={2.6} strokeLinecap="round" className="gl-esc-pulso" />
    </>
  );
}

function Procesos({ acc }: { acc: string }) {
  const cajas = [14, 62, 110, 150];
  return (
    <>
      {cajas.map((x, i) => (
        <g key={x} className="gl-esc-flota" style={estilo('4.6s', -i * 0.6)}>
          <rect x={x} y={34} width={i === 3 ? 38 : 34} height={26} rx={5} fill={i === 1 ? acc : B} />
          <path d={`M${x + 8} 44 H${x + 26} M${x + 8} 51 H${x + 20}`} stroke="rgba(8,50,46,0.4)" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      ))}
      {[48, 96, 144].map((x) => (
        <path key={x} d={`M${x + 2} 47 H${x + 12}`} stroke={B} strokeWidth={2.6} strokeLinecap="round" className="gl-esc-flujo" />
      ))}
      <path d="M31 66 V80 H168 V66" fill="none" stroke={S} strokeWidth={2} strokeDasharray="4 4" />
      <Engranaje x={100} y={16} r={8} n={7} dur="8s" relleno={acc} />
    </>
  );
}

function Calidad({ acc }: { acc: string }) {
  return (
    <>
      <path d="M32 78 A48 48 0 0 1 128 78" fill="none" stroke={B} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <path d="M32 78 A48 48 0 0 1 70 34" fill="none" stroke="#F2704E" strokeWidth={6} strokeLinecap="round" />
      <path d="M70 34 A48 48 0 0 1 90 30" fill="none" stroke="#FBBF24" strokeWidth={6} strokeLinecap="round" />
      <path d="M90 30 A48 48 0 0 1 128 78" fill="none" stroke="#4CE07E" strokeWidth={6} strokeLinecap="round" />
      <g transform="translate(80 78)">
        <g className="gl-esc-balancea" style={{ ...estilo('3.4s'), transformBox: 'view-box', transformOrigin: '0px 0px' }}>
          <path d="M0 0 L8 -38" stroke={B} strokeWidth={3.4} strokeLinecap="round" />
        </g>
        <circle r={6} fill={B} />
      </g>
      <g className="gl-esc-flota" style={estilo('4s', -1)} transform="translate(160 36)">
        <circle r={17} fill={acc} stroke="rgba(0,0,0,0.12)" strokeWidth={1.4} />
        <path d="M-8 1 L-2 8 L9 -6" fill="none" stroke="#10302A" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Lupa x={162} y={74} />
    </>
  );
}

function Lean({ acc }: { acc: string }) {
  return (
    <>
      <Giro x={60} y={52} dur="12s">
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d="M0 -30 A30 30 0 0 1 30 0" fill="none" stroke={a % 180 === 0 ? B : acc} strokeWidth={5} strokeLinecap="round" />
            <path d="M24 -4 L33 2 L36 -8 Z" fill={a % 180 === 0 ? B : acc} transform="translate(-1 0)" />
          </g>
        ))}
      </Giro>
      {[['P', 60, 20], ['D', 92, 56], ['C', 60, 90], ['A', 28, 56]].map(([t, x, y]) => (
        <text key={t as string} x={x as number} y={(y as number) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill={B} fontFamily="system-ui, sans-serif">{t}</text>
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i} className="gl-esc-flota" style={estilo('3.4s', -i * 0.7)}>
          <rect x={120 + i * 24} y={26 + (i % 2) * 14} width={20} height={26} rx={3} fill={i === 1 ? acc : B} />
          <path d={`M${124 + i * 24} ${34 + (i % 2) * 14} H${136 + i * 24} M${124 + i * 24} ${41 + (i % 2) * 14} H${132 + i * 24}`} stroke="rgba(8,50,46,0.4)" strokeWidth={2.2} strokeLinecap="round" />
        </g>
      ))}
      <text x={124} y={84} fontSize={10} {...mono} fill={B}>kaizen · 改善</text>
    </>
  );
}

function Logistica({ acc }: { acc: string }) {
  return (
    <>
      <path d="M14 70 Q 60 40, 110 62 T 186 40" fill="none" stroke={S} strokeWidth={2} strokeDasharray="4 5" className="gl-esc-flujo" />
      <g className="gl-esc-flota" style={estilo('3.4s')}>
        <rect x={20} y={36} width={58} height={30} rx={3} fill={B} />
        <rect x={26} y={42} width={46} height={18} rx={2} fill={acc} opacity={0.9} />
        <path d="M78 46 H92 L100 56 V66 H78 Z" fill={B} />
        <rect x={84} y={49} width={9} height={8} rx={1.5} fill={P} />
        <g className="gl-esc-gira" style={estilo('1.2s')}>
          <circle cx={36} cy={70} r={7} fill="#10302A" />
          <path d="M36 64 V76 M30 70 H42" stroke={B} strokeWidth={1.6} />
        </g>
        <g className="gl-esc-gira" style={estilo('1.2s')}>
          <circle cx={88} cy={70} r={7} fill="#10302A" />
          <path d="M88 64 V76 M82 70 H94" stroke={B} strokeWidth={1.6} />
        </g>
      </g>
      <g className="gl-esc-flota" style={estilo('4.6s', -1)} transform="translate(142 56)">
        <path d="M0 14 H44 L38 26 H6 Z" fill={B} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={6 + i * 11} y={2} width={10} height={12} rx={1.5} fill={i === 1 ? acc : B} stroke="rgba(0,0,0,0.16)" />
        ))}
      </g>
      <path d="M130 90 q8 -6 16 0 t16 0 t16 0 t16 0" fill="none" stroke={S} strokeWidth={2} strokeLinecap="round" />
      <circle className="gl-esc-pulso" cx={176} cy={20} r={5} fill={acc} />
    </>
  );
}

export const MOTIVOS: Record<string, Motivo> = {
  python: Python,
  pythonAuto: PythonAuto,
  datosPython: DatosPython,
  pythonAvanzado: PythonAvanzado,
  fundamentos: Fundamentos,
  poo: Poo,
  bd: BasesDeDatos,
  redes: Redes,
  estructuras: Estructuras,
  web: Web,
  nube: Nube,
  arquitectura: Arquitectura,
  ia: InteligenciaArtificial,
  distribuidos: Distribuidos,
  discretas: Discretas,
  derivada: Derivada,
  integral: Integral,
  estadistica: Estadistica,
  matrices: Matrices,
  contabilidad: Contabilidad,
  finanzas: Finanzas,
  agil: Agil,
  liderazgo: Liderazgo,
  emprendimiento: Emprendimiento,
  inglesA2: InglesA2,
  inglesB1: InglesB1,
  inglesB2: InglesB2,
  escritura: Escritura,
  procesos: Procesos,
  calidad: Calidad,
  lean: Lean,
  logistica: Logistica,
};

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// de más específico a más general: el primero que encaje gana
const REGLAS: [RegExp, string][] = [
  [/python.*(avanzad|api|prueba|concurrencia)/, 'pythonAvanzado'],
  [/python.*automatiz|automatiz.*python/, 'pythonAuto'],
  [/python.*(datos|analisis)|analisis de datos|pandas/, 'datosPython'],
  [/python/, 'python'],
  [/orientada a objetos|\bpoo\b/, 'poo'],
  [/fundamentos de programacion|logica de programacion/, 'fundamentos'],
  [/bases de datos|\bsql\b|relacional/, 'bd'],
  [/estructuras de datos|algoritmo/, 'estructuras'],
  [/inteligencia artificial|aprendizaje automatico|machine learning/, 'ia'],
  [/distribuid|concurrencia/, 'distribuidos'],
  [/arquitectura de software/, 'arquitectura'],
  [/nube|devops|cloud/, 'nube'],
  [/backend|desarrollo web|frontend/, 'web'],
  [/redes/, 'redes'],
  [/discretas|logica matematica/, 'discretas'],
  [/calculo diferencial|derivad/, 'derivada'],
  [/calculo integral|integral/, 'integral'],
  [/probabilidad|estadistica/, 'estadistica'],
  [/algebra lineal|matrices|matriz/, 'matrices'],
  [/contabilidad/, 'contabilidad'],
  [/finanzas|inversion/, 'finanzas'],
  [/agil|scrum|proyectos/, 'agil'],
  [/liderazgo|equipos/, 'liderazgo'],
  [/emprendimiento|innovacion|startup/, 'emprendimiento'],
  [/ingles.*b2|b2/, 'inglesB2'],
  [/ingles.*b1|b1/, 'inglesB1'],
  [/ingles|english|a2/, 'inglesA2'],
  [/escritura|redaccion|ortografia/, 'escritura'],
  [/gestion de procesos|procesos/, 'procesos'],
  [/calidad/, 'calidad'],
  [/lean|mejora continua|kaizen/, 'lean'],
  [/logistica|cadena de suministro|transporte/, 'logistica'],
];

/** El motivo (dibujo) que le toca a un curso según su título y habilidades, o null si ninguno encaja. */
export function motivoDe(titulo: string, habilidades: string[] = []): string | null {
  const texto = normalizar(`${titulo} ${habilidades.join(' ')}`);
  const soloTitulo = normalizar(titulo);
  // primero se intenta con el título solo (lo más fiable) y luego con las habilidades
  for (const [regla, clave] of REGLAS) if (regla.test(soloTitulo)) return clave;
  for (const [regla, clave] of REGLAS) if (regla.test(texto)) return clave;
  return null;
}
