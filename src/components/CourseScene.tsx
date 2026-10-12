import type { ReactElement } from 'react';
import { B, S, P, Engranaje, estilo } from './escenaBase';
import { MOTIVOS, motivoDe } from './CourseMotifs';

// Las escenas de las ilustraciones del catálogo: cada área tiene la suya, hecha de unas cuantas "cositas" que se
// mueven (un engranaje que gira, una grúa, una balanza, barras que crecen…). Son SVG dibujados aquí (nada que
// descargar) sobre un lienzo de 200 x 100, y se apagan con "reducir movimiento".

const FICHAS_A = ['</>', 'API', 'SQL', '01', 'fn()', '#!'];
const FICHAS_B = ['{ }', '[ ]', '=>', '&&', 'git', '</>'];

function Sistemas({ acc, s }: { acc: string; s: number }) {
  // cada curso mueve un poco las lineas de codigo y cambia las fichas flotantes
  const ancho = (i: number, base: number) => base + ((s >> i) % 4) * 4;
  return (
    <>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <rect x={34} y={18} width={96} height={64} rx={7} fill={P} stroke={S} />
        <rect x={34} y={18} width={96} height={13} rx={7} fill="rgba(255,255,255,0.2)" />
        <circle cx={43} cy={24.5} r={2.3} fill="#F2704E" />
        <circle cx={51} cy={24.5} r={2.3} fill="#F5A524" />
        <circle cx={59} cy={24.5} r={2.3} fill="#4CE07E" />
        <rect x={42} y={38} width={ancho(1, 24)} height={4.2} rx={2.1} fill={acc} />
        <rect x={46 + ancho(1, 24)} y={38} width={ancho(3, 18)} height={4.2} rx={2.1} fill={B} opacity={0.85} />
        <rect x={50} y={47} width={ancho(5, 36)} height={4.2} rx={2.1} fill={B} opacity={0.75} />
        <rect x={50} y={56} width={ancho(7, 16)} height={4.2} rx={2.1} fill={acc} opacity={0.9} />
        <rect x={54 + ancho(7, 16)} y={56} width={ancho(9, 24)} height={4.2} rx={2.1} fill={B} opacity={0.7} />
        <rect x={42} y={65} width={ancho(11, 28)} height={4.2} rx={2.1} fill={B} opacity={0.6} />
        <rect className="gl-esc-pulso" x={80} y={64} width={3.2} height={7} fill={B} style={estilo('1s')} />
      </g>
      <Engranaje x={158} y={34} r={13} n={8} dur="9s" />
      <Engranaje x={175} y={56} r={8} n={6} dur="9s" inverso relleno={acc} />
      <g className="gl-esc-flota" style={estilo('4s', -1)}>
        <rect x={150} y={68} width={20} height={20} rx={3} fill={P} stroke={B} strokeWidth={1.4} />
        <rect x={156} y={74} width={8} height={8} rx={1.5} fill={acc} />
        {[154, 160, 166].map((x) => (
          <path key={x} d={`M ${x} 68 V 64 M ${x} 88 V 92`} stroke={B} strokeWidth={1.6} strokeLinecap="round" />
        ))}
      </g>
      <text x={20} y={34} fontSize={15} fontFamily="monospace" fontWeight={700} fill={B} className="gl-esc-flota" style={estilo('3.4s')}>{FICHAS_A[s % FICHAS_A.length]}</text>
      <text x={16} y={80} fontSize={17} fontFamily="monospace" fontWeight={700} fill={acc} className="gl-esc-flota" style={estilo('4.4s', -2)}>{FICHAS_B[(s >> 3) % FICHAS_B.length]}</text>
    </>
  );
}

function Civil({ acc }: { acc: string }) {
  return (
    <>
      <path d="M14 82 H186" stroke={S} strokeWidth={2} strokeLinecap="round" />
      <path d="M22 78 Q80 18 138 78" fill="none" stroke={B} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M18 62 H142" stroke={B} strokeWidth={3} strokeLinecap="round" />
      {[0.18, 0.28, 0.38, 0.5, 0.62, 0.72, 0.82].map((t) => {
        // los tirantes cuelgan del arco: se calcula el punto de la curva (22,78) (80,18) (138,78) en cada t
        const x = (1 - t) * (1 - t) * 22 + 2 * (1 - t) * t * 80 + t * t * 138;
        const y = (1 - t) * (1 - t) * 78 + 2 * (1 - t) * t * 18 + t * t * 78;
        return <path key={t} d={`M ${x.toFixed(1)} ${y.toFixed(1)} V 62`} stroke={S} strokeWidth={1.4} />;
      })}
      {[26, 134].map((x) => (
        <rect key={x} x={x - 2} y={60} width={4} height={22} fill={B} />
      ))}
      <g className="gl-esc-flota" style={estilo('6s')}>
        <rect x={160} y={30} width={4} height={52} fill={B} />
        <path d="M150 30 H190 M160 30 L176 18 L190 30" fill="none" stroke={B} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M184 30 V50" stroke={S} strokeWidth={1.4} />
        <rect x={180} y={50} width={8} height={7} rx={1.4} fill={acc} />
      </g>
      <g className="gl-esc-flota" style={estilo('4.6s', -1.5)}>
        <path d="M82 28 Q100 12 118 28 Z" fill={acc} stroke="rgba(0,0,0,0.12)" />
        <rect x={78} y={27} width={44} height={4} rx={2} fill={acc} opacity={0.9} />
      </g>
      <rect x={8} y={68} width={12} height={14} fill={B} opacity={0.6} />
      <rect x={4} y={72} width={8} height={10} fill={B} opacity={0.4} />
    </>
  );
}

function Industrial({ acc }: { acc: string }) {
  return (
    <>
      <rect x={14} y={66} width={150} height={10} rx={5} fill={P} stroke={S} />
      <path d="M20 71 H158" stroke={B} strokeWidth={1.6} className="gl-esc-cinta" />
      {[0, 1, 2].map((i) => (
        <g key={i} className="gl-esc-caja" style={estilo('6s', -i * 2)}>
          <rect x={0} y={52} width={16} height={14} rx={2} fill={i === 1 ? acc : B} stroke="rgba(0,0,0,0.12)" />
          <path d="M0 58 H16" stroke="rgba(0,0,0,0.18)" />
        </g>
      ))}
      <circle cx={20} cy={79} r={4} fill={B} />
      <circle cx={158} cy={79} r={4} fill={B} />
      <Engranaje x={42} y={32} r={16} n={9} dur="10s" />
      <Engranaje x={70} y={22} r={9} n={6} dur="10s" inverso relleno={acc} />
      <g>
        <rect x={150} y={22} width={14} height={30} fill={P} stroke={B} strokeWidth={1.4} />
        <rect x={146} y={18} width={22} height={6} rx={2} fill={B} />
        {[0, 1, 2].map((i) => (
          <circle key={i} className="gl-esc-humo" cx={157 + i * 3} cy={14} r={5} fill="rgba(255,255,255,0.7)" style={{ animationDelay: `${-i * 1}s` }} />
        ))}
      </g>
      <rect x={172} y={36} width={16} height={16} fill={P} stroke={B} strokeWidth={1.2} />
      <rect x={176} y={40} width={4} height={4} fill={acc} />
      <rect x={182} y={40} width={4} height={4} fill={B} />
    </>
  );
}

function Electronica({ acc }: { acc: string }) {
  return (
    <>
      <g fill="none" stroke={S} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 30 H60 V44" />
        <path d="M20 70 H62 V58" />
        <path d="M140 30 H180 V20" />
        <path d="M140 70 H170 V84 H190" />
        <path d="M100 18 V8 M92 18 V10 M108 18 V10" />
      </g>
      <g fill="none" stroke={acc} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 30 H60 V44" className="gl-esc-flujo" />
        <path d="M20 70 H62 V58" className="gl-esc-flujo" style={{ animationDelay: '-0.6s' }} />
        <path d="M140 30 H180 V20" className="gl-esc-flujo" style={{ animationDelay: '-1.1s' }} />
        <path d="M140 70 H170 V84 H190" className="gl-esc-flujo" style={{ animationDelay: '-0.3s' }} />
      </g>
      <g className="gl-esc-flota" style={estilo('5s')}>
        <rect x={66} y={34} width={68} height={42} rx={6} fill={P} stroke={B} strokeWidth={2} />
        <rect x={80} y={44} width={40} height={22} rx={3} fill="rgba(255,255,255,0.16)" />
        <path d="M86 55 H96 L100 49 L104 61 L108 55 H114" fill="none" stroke={B} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {[76, 88, 100, 112, 124].map((x) => (
          <path key={x} d={`M ${x} 34 V 28 M ${x} 76 V 82`} stroke={B} strokeWidth={2.4} strokeLinecap="round" />
        ))}
      </g>
      {[[20, 30], [20, 70], [180, 20], [190, 84]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={3.4} fill={B} />
      ))}
      <circle className="gl-esc-pulso" cx={170} cy={56} r={6} fill={acc} />
      <circle cx={170} cy={56} r={9} fill="none" stroke={acc} strokeOpacity={0.5} />
      <path className="gl-esc-pulso" d="M40 44 L34 56 H42 L36 68" fill="none" stroke="#FBBF24" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={estilo('1.8s')} />
    </>
  );
}

function Mecanica({ acc }: { acc: string }) {
  return (
    <>
      <Engranaje x={62} y={56} r={26} n={11} dur="12s" />
      <Engranaje x={108} y={36} r={16} n={7} dur="12s" inverso relleno={acc} />
      <Engranaje x={130} y={70} r={11} n={6} dur="12s" />
      <g>
        <rect x={158} y={20} width={20} height={56} rx={4} fill={P} stroke={B} strokeWidth={1.6} />
        <g className="gl-esc-flota" style={estilo('1.8s')}>
          <rect x={161} y={40} width={14} height={20} rx={2} fill={B} />
          <path d="M168 60 V86" stroke={B} strokeWidth={3} strokeLinecap="round" />
        </g>
        <circle cx={168} cy={88} r={4.4} fill={acc} />
      </g>
      <g className="gl-esc-flota" style={estilo('5s', -1)}>
        <path d="M20 22 l14 14 M16 30 a7 7 0 1 1 11 -9 l-4 4 l9 9 l-4 4 l-9 -9 l-4 4 a7 7 0 0 1 1 -3z" fill="none" stroke={B} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

function Ambiental({ acc }: { acc: string }) {
  return (
    <>
      <path d="M0 84 Q50 70 100 82 T200 78 V100 H0 Z" fill="rgba(255,255,255,0.28)" />
      <g transform="translate(168 26)">
        <g className="gl-esc-gira" style={estilo('20s')}>
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d="M0 -17 V-23" stroke={acc} strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${i * 36})`} />
          ))}
        </g>
        <circle r={11} fill="#FBBF24" />
      </g>
      <g>
        <path d="M44 84 L48 36" stroke={B} strokeWidth={3} strokeLinecap="round" />
        <g transform="translate(48 36)">
          <g className="gl-esc-gira" style={estilo('4s')}>
            {[0, 120, 240].map((a) => (
              <path key={a} d="M0 0 Q4 -12 0 -26 Q-4 -12 0 0 Z" fill={B} transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r={3.2} fill={acc} />
        </g>
      </g>
      <g className="gl-esc-flota" style={estilo('6s')}>
        <rect x={104} y={58} width={5} height={26} fill="#8B6B4A" />
        <circle cx={106.5} cy={50} r={18} fill={B} opacity={0.95} />
        <circle cx={98} cy={56} r={11} fill={acc} opacity={0.85} />
        <circle cx={116} cy={54} r={10} fill="rgba(255,255,255,0.7)" />
      </g>
      {[76, 142, 150].map((x, i) => (
        <path key={x} className="gl-esc-gota" d={`M ${x} 38 q 4 6 0 10 q -4 -4 0 -10 z`} fill="#BEE9FF" style={{ animationDelay: `${-i * 0.7}s` }} />
      ))}
      <path className="gl-esc-flota" d="M72 30 q8 -10 18 -4 q-4 12 -18 4 z" fill={acc} style={estilo('4s', -1)} />
    </>
  );
}

const SIMBOLOS = [
  ['π', '∑', '√', '∫'],
  ['∞', 'Δ', '%', '≈'],
  ['θ', 'λ', '±', '÷'],
];

function Matematicas({ acc, s }: { acc: string; s: number }) {
  const sim = SIMBOLOS[s % SIMBOLOS.length];
  return (
    <>
      <g stroke={S} strokeWidth={1.4} strokeLinecap="round">
        <path d="M24 18 V84 M16 62 H116" />
        <path d="M24 18 l-3 6 M24 18 l3 6 M116 62 l-6 -3 M116 62 l-6 3" fill="none" />
      </g>
      <path d="M24 62 C 40 20, 52 20, 68 62 S 96 104, 112 62" fill="none" stroke={B} strokeWidth={2.8} strokeLinecap="round" />
      <path d="M24 62 C 40 20, 52 20, 68 62 S 96 104, 112 62" fill="none" stroke={acc} strokeWidth={3.2} strokeLinecap="round" className="gl-esc-flujo" style={{ strokeDasharray: '4 36' }} />
      <circle className="gl-esc-pulso" cx={46} cy={30} r={3.4} fill={acc} />
      <g fill={B} fontFamily="Georgia, serif" fontWeight={700}>
        <text x={132} y={38} fontSize={26} className="gl-esc-flota" style={estilo('4s')}>{sim[0]}</text>
        <text x={164} y={30} fontSize={20} fill={acc} className="gl-esc-flota" style={estilo('5s', -1)}>{sim[1]}</text>
        <text x={150} y={72} fontSize={22} className="gl-esc-flota" style={estilo('4.6s', -2)}>{sim[2]}</text>
        <text x={176} y={78} fontSize={20} fill={acc} className="gl-esc-flota" style={estilo('3.8s', -0.5)}>{sim[3]}</text>
      </g>
    </>
  );
}

const BARRAS = [
  [26, 40, 34, 52, 64],
  [34, 28, 46, 42, 60],
  [20, 32, 44, 56, 50],
];

function Administracion({ acc, s }: { acc: string; s: number }) {
  const barras = BARRAS[s % BARRAS.length];
  return (
    <>
      <path d="M22 84 H122" stroke={S} strokeWidth={2} strokeLinecap="round" />
      {barras.map((h, i) => (
        <rect key={i} className="gl-esc-barra" x={28 + i * 19} y={84 - h} width={13} height={h} rx={3} fill={i === 4 ? acc : B} style={estilo('3.2s', -i * 0.35)} />
      ))}
      <path d="M28 52 L52 40 L72 46 L96 28 L118 18" fill="none" stroke={B} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 5" />
      <path d="M110 16 L120 17 L117 27" fill="none" stroke={B} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <g className="gl-esc-flota" style={estilo('3.6s')}>
        <circle cx={152} cy={32} r={15} fill="#FBBF24" stroke="rgba(0,0,0,0.12)" strokeWidth={1.4} />
        <circle cx={152} cy={32} r={10.5} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1.4} />
        <text x={152} y={38} textAnchor="middle" fontSize={16} fontWeight={800} fill="rgba(80,50,0,0.85)" fontFamily="Georgia, serif">$</text>
      </g>
      <g className="gl-esc-flota" style={estilo('5s', -1.5)}>
        <path d="M168 68 v-6 h14 v6" fill="none" stroke={B} strokeWidth={2} />
        <rect x={160} y={68} width={30} height={20} rx={3} fill={P} stroke={B} strokeWidth={1.8} />
        <rect x={172} y={76} width={6} height={5} rx={1} fill={acc} />
      </g>
      <g transform="translate(140 72)">
        <circle r={11} fill="rgba(255,255,255,0.3)" />
        <path d="M0 0 L0 -11 A11 11 0 0 1 9.5 5.5 Z" fill={acc} />
      </g>
    </>
  );
}

const SALUDOS = [
  ['Hello', 'Hola'],
  ['Hi', 'Hola'],
  ['Hello', 'Ciao'],
  ['Thanks', 'Gracias'],
  ['Hello', 'Bonjour'],
  ['Bye', 'Adiós'],
];

function Idiomas({ acc, s }: { acc: string; s: number }) {
  const [ingles, otro] = SALUDOS[s % SALUDOS.length];
  return (
    <>
      <g className="gl-esc-habla" style={estilo('3.6s')}>
        <path d="M28 18 H92 a8 8 0 0 1 8 8 V42 a8 8 0 0 1 -8 8 H52 L38 62 V50 H28 a8 8 0 0 1 -8 -8 V26 a8 8 0 0 1 8 -8 Z" fill={B} />
        <text x={60} y={39} textAnchor="middle" fontSize={15} fontWeight={800} fill="rgba(8,60,56,0.9)" fontFamily="system-ui, sans-serif">{ingles}</text>
      </g>
      <g className="gl-esc-habla" style={estilo('4.2s', -1.4)}>
        <path d="M96 52 H168 a8 8 0 0 1 8 8 V74 a8 8 0 0 1 -8 8 H150 L140 92 V82 H96 a8 8 0 0 1 -8 -8 V60 a8 8 0 0 1 8 -8 Z" fill={acc} />
        <text x={132} y={72} textAnchor="middle" fontSize={15} fontWeight={800} fill="rgba(255,255,255,0.97)" fontFamily="system-ui, sans-serif">{otro}</text>
      </g>
      <g transform="translate(162 28)">
        <circle r={17} fill={P} stroke={B} strokeWidth={1.8} />
        <g className="gl-esc-gira" style={estilo('14s')}>
          <ellipse rx={7} ry={17} fill="none" stroke={B} strokeWidth={1.4} />
          <ellipse rx={13} ry={17} fill="none" stroke={S} strokeWidth={1.2} />
        </g>
        <path d="M-17 0 H17" stroke={B} strokeWidth={1.4} />
        <path d="M-14 -9 H14 M-14 9 H14" stroke={S} strokeWidth={1.2} />
      </g>
      <text x={22} y={86} fontSize={12} fontWeight={800} fill={B} fontFamily="system-ui, sans-serif" className="gl-esc-flota" style={estilo('4s', -0.6)}>ABC</text>
      <text x={64} y={92} fontSize={11} fontWeight={800} fill={acc} fontFamily="system-ui, sans-serif" className="gl-esc-flota" style={estilo('5s', -2)}>¿?</text>
    </>
  );
}

function Derecho({ acc }: { acc: string }) {
  return (
    <>
      <g opacity={0.5}>
        {[14, 26, 38].map((x) => (
          <rect key={x} x={x} y={34} width={6} height={46} fill={B} />
        ))}
        <rect x={10} y={28} width={38} height={6} fill={B} />
        <rect x={10} y={80} width={38} height={5} fill={B} />
      </g>
      <g>
        <rect x={98} y={26} width={4} height={56} fill={B} />
        <rect x={86} y={80} width={28} height={5} rx={2} fill={B} />
        <g className="gl-esc-balancea" style={estilo('4s')}>
          <rect x={60} y={25} width={80} height={4} rx={2} fill={B} />
          <path d="M66 29 L56 52 H76 Z" fill="none" stroke={B} strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M134 29 L124 52 H144 Z" fill="none" stroke={B} strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M52 52 Q66 66 80 52 Z" fill={acc} />
          <path d="M120 52 Q134 66 148 52 Z" fill={B} />
        </g>
        <circle cx={100} cy={24} r={4.4} fill={acc} />
      </g>
      <g className="gl-esc-flota" style={estilo('5s', -1)}>
        <rect x={158} y={22} width={28} height={36} rx={3} fill={P} stroke={B} strokeWidth={1.6} />
        <path d="M163 32 H181 M163 39 H181 M163 46 H174" stroke={B} strokeWidth={1.8} strokeLinecap="round" />
        <circle cx={181} cy={52} r={4} fill={acc} />
      </g>
      <g className="gl-esc-flota" style={estilo('3.2s', -0.8)}>
        <rect x={150} y={68} width={26} height={10} rx={3} fill={B} transform="rotate(-24 163 73)" />
        <rect x={166} y={64} width={4} height={26} rx={2} fill={acc} transform="rotate(30 168 77)" />
      </g>
    </>
  );
}

function Generica({ acc }: { acc: string }) {
  return (
    <>
      <Engranaje x={80} y={52} r={22} n={9} dur="12s" />
      <Engranaje x={122} y={38} r={13} n={7} dur="12s" inverso relleno={acc} />
    </>
  );
}

const ESCENAS: Record<string, (p: { acc: string; s: number }) => ReactElement> = {
  'Ingeniería de Sistemas': Sistemas,
  'Ingeniería Civil': Civil,
  'Ingeniería Industrial': Industrial,
  'Ingeniería Electrónica': Electronica,
  'Ingeniería Mecánica': Mecanica,
  'Ingeniería Ambiental': Ambiental,
  Matemáticas: Matematicas,
  'Administración de Empresas': Administracion,
  Idiomas: Idiomas,
  Derecho: Derecho,
};

export default function CourseScene({ category, acc, semilla, titulo, habilidades }: { category: string; acc: string; semilla: number; titulo?: string; habilidades?: string[] }) {
  // si el curso tiene un tema reconocible (Python, bases de datos, kanban…) se dibuja ese; si no, la escena de su área
  const clave = titulo ? motivoDe(titulo, habilidades ?? []) : null;
  const Motivo = clave ? MOTIVOS[clave] : null;
  if (Motivo) {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full drop-shadow-md" aria-hidden="true">
        <Motivo acc={acc} />
      </svg>
    );
  }
  const Escena = ESCENAS[category] ?? Generica;
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full drop-shadow-md" aria-hidden="true">
      <Escena acc={acc} s={semilla} />
    </svg>
  );
}
