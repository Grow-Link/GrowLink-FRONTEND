import { useState, useEffect } from 'react';
import heroLearner from '../imports/heroLearner.png';
import logo from '../imports/logoGrowLink.png';
import Button from '../components/Button';
import LiveIndicator from '../components/LiveIndicator';
import RoadmapGraph from '../components/RoadmapGraph';
import Reveal from '../components/Reveal';
import { useMouseTilt } from '../hooks/useMouseTilt';
import { useNavigation } from '../store/NavigationContext';
import { useTheme } from '../store/ThemeContext';
import { mockCourses, CATEGORIES } from '../services/mockData';
import type { RoadmapNode, RoadmapEdge } from '../types';

const SECTIONS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'publicadores', label: 'Publicadores' },
  { id: 'trivia', label: 'Trivia' },
];

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Trivia', href: '#trivia' },
  { label: 'Para publicadores', href: '#publicadores' },
];

const DEMO_ROADMAP_NODES: RoadmapNode[] = [
  { id: 'd-c1', courseId: 'c1', tier: 0, status: 'completed' },
  { id: 'd-c2', courseId: 'c2', tier: 0, status: 'completed' },
  { id: 'd-c3', courseId: 'c3', tier: 1, status: 'current' },
  { id: 'd-c4', courseId: 'c4', tier: 1, status: 'available' },
  { id: 'd-c5', courseId: 'c5', tier: 2, status: 'locked' },
];
const DEMO_ROADMAP_EDGES: RoadmapEdge[] = [
  { from: 'c1', to: 'c3' },
  { from: 'c1', to: 'c4' },
  { from: 'c2', to: 'c4' },
  { from: 'c4', to: 'c5' },
];

const STEPS = [
  {
    n: '01',
    title: 'Cuéntanos tus metas',
    desc: 'Tres checkpoints: tu meta, tus intereses y tu nivel. Menos de 3 minutos.',
    accent: '#1E73E8',
  },
  {
    n: '02',
    title: 'La IA arma tu roadmap',
    desc: 'Un camino de cursos reales, con prerequisitos claros — no una lista genérica.',
    accent: '#12C2A8',
  },
  {
    n: '03',
    title: 'Aprende y compite',
    desc: 'Avanza curso a curso y refuerza lo aprendido en salas de trivia en vivo.',
    accent: '#4CE07E',
  },
];

const AUDIENCE = [
  {
    key: 'learner',
    label: 'Para quien aprende',
    title: 'Un plan, no una lista de videos sueltos.',
    points: ['Roadmap generado a tu medida', 'Prerequisitos claros entre cursos', 'Historial y habilidades desbloqueadas'],
    accent: '#1E73E8',
  },
  {
    key: 'publisher',
    label: 'Para quien enseña',
    title: 'Publica cursos que sí encajan en el camino de alguien.',
    points: ['Prerequisitos sugeridos por IA, editables', 'Panel de tus cursos activos', 'Preguntas de trivia para tu categoría'],
    accent: '#12C2A8',
  },
];

function SectionDots() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hidden xl:flex flex-col gap-4 fixed right-6 top-1/2 -translate-y-1/2 z-40 bg-white/70 dark:bg-[#0B1F3A]/70 backdrop-blur-md rounded-full py-5 px-3 border border-[#DDE4ED] dark:border-white/10 shadow-lg">
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
            className="group/dot relative flex items-center justify-center cursor-pointer"
            aria-label={s.label}
          >
            <span className="absolute right-6 whitespace-nowrap text-xs font-mono text-white bg-[#0B1F3A] px-2.5 py-1 rounded-md opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">
              {s.label}
            </span>
            <span
              className={`block rotate-45 transition-all duration-300 ${isActive ? 'w-2.5 h-2.5 gl-gradient' : 'w-1.5 h-1.5 bg-[#6B7A99]/50 dark:bg-white/30 group-hover/dot:bg-[#6B7A99] dark:group-hover/dot:bg-white/60'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

function LiveLeaderboard() {
  const [order, setOrder] = useState([
    { name: 'Valentina R.', score: 2400 },
    { name: 'Marco A.', score: 2200 },
    { name: 'Sofía L.', score: 1900 },
  ]);
  useEffect(() => {
    const t = setInterval(() => {
      setOrder((prev) => {
        const next = prev.map((p) => ({ ...p }));
        next[Math.floor(Math.random() * next.length)].score += Math.floor(80 + Math.random() * 220);
        return next.sort((a, b) => b.score - a.score);
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-[#0F2240] border border-white/10 rounded-2xl p-4 w-full max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-display font-bold text-white">Leaderboard</p>
        <LiveIndicator label="VIVO" color="green" />
      </div>
      <div className="space-y-2">
        {order.map((p, i) => (
          <div key={p.name} className="flex items-center gap-2.5 bg-white/5 rounded-lg px-2.5 py-2 transition-all duration-500">
            <span className={`text-xs font-mono font-bold w-4 ${i === 0 ? 'text-[#F59E0B]' : 'text-[#8BA5C2]'}`}>{i + 1}</span>
            <div className="w-6 h-6 rounded-full gl-gradient flex items-center justify-center text-white text-[10px] font-bold shrink-0">{p.name[0]}</div>
            <span className="text-xs text-white flex-1 truncate">{p.name}</span>
            <span className="text-xs font-mono font-bold text-[#4CE07E]">{p.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { navigate } = useNavigation();
  const { isDark, toggle } = useTheme();
  const heroRef = useMouseTilt<HTMLDivElement>(8);
  const [mobileOpen, setMobileOpen] = useState(false);

  function scrollTo(href: string) {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629] overflow-x-hidden">
      <SectionDots />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B1F3A]/80 backdrop-blur-md border-b border-[#DDE4ED] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src={logo} alt="GrowLink" className="h-7 w-auto object-contain" />

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-white hover:bg-[#F7F9FA] dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => navigate('select-user')}
              className="hidden sm:inline-flex text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] hover:text-[#1E73E8] transition-colors cursor-pointer"
            >
              Ingresar
            </button>
            <Button variant="gradient" size="sm" onClick={() => navigate('select-user')}>
              Prueba GrowLink Ahora
            </Button>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#6B7A99] dark:text-[#8BA5C2]"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="lg:hidden border-t border-[#DDE4ED] dark:border-white/10 px-4 py-3 space-y-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-white/5"
              >
                {l.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden bg-[#0B1F3A] min-h-[92vh] flex flex-col">
        <div className="absolute inset-0">
          <div className="gl-float absolute top-0 right-0 w-[36rem] h-[36rem] gl-gradient opacity-15 rounded-full blur-3xl translate-x-1/4 -translate-y-1/3" />
          <div className="gl-float absolute bottom-0 left-0 w-96 h-96 bg-[#12C2A8] opacity-10 rounded-full blur-3xl -translate-x-1/3" style={{ animationDelay: '-3s' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 relative z-10 flex-1 flex items-center w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-8 items-center w-full">
            {/* Left copy */}
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-7">
                <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Plataforma de crecimiento</span>
              </div>
              <h1 className="text-5xl sm:text-6xl xl:text-[5rem] font-display font-bold text-white leading-[0.98] tracking-tight mb-7">
                Deja de<br />adivinar<br />
                <span className="gl-gradient-text">qué estudiar.</span>
              </h1>
              <p className="text-[#8BA5C2] text-lg leading-relaxed max-w-md mb-10">
                GrowLink convierte tus metas en un roadmap real de cursos con prerequisitos claros, y lo refuerza con
                trivia competitiva en vivo — para que lo aprendido se quede.
              </p>
              <div className="flex flex-wrap items-center gap-5 mb-12">
                <Button variant="gradient" size="lg" onClick={() => navigate('select-user')}>
                  Probar GrowLink ahora
                </Button>
                <button
                  onClick={() => scrollTo('#como-funciona')}
                  className="flex items-center gap-2 text-sm font-semibold text-[#8BA5C2] hover:text-white transition-colors cursor-pointer"
                >
                  Ver cómo funciona
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-8 border-t border-white/10 pt-7">
                {[
                  { value: String(mockCourses.filter((c) => c.status === 'active').length), label: 'Cursos activos' },
                  { value: String(CATEGORIES.length), label: 'Categorías' },
                  { value: '3', label: 'Roles distintos' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-3xl font-mono font-bold text-white">{s.value}</p>
                    <p className="text-xs text-[#8BA5C2] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: interactive 3D photo — full image, native transparent background */}
            <div className="gl-perspective relative">
              <div ref={heroRef} className="gl-tilt gl-cursor-glow relative mx-auto w-full max-w-2xl">
                <div
                  className="gl-tilt-layer absolute -inset-10 rounded-full bg-gradient-to-br from-[#12C2A8]/25 to-[#1E73E8]/10 blur-[70px]"
                  style={{ ['--tz' as string]: '-60px' }}
                />
                <img
                  src={heroLearner}
                  alt="Estudiante usando GrowLink"
                  className="gl-tilt-layer relative z-10 w-full h-auto object-contain"
                  style={{
                    ['--tz' as string]: '30px',
                    filter:
                      'drop-shadow(0 0 3px rgba(11,31,58,0.7)) drop-shadow(0 0 14px rgba(11,31,58,0.55)) drop-shadow(0 0 42px rgba(18,194,168,0.22)) drop-shadow(0 0 80px rgba(30,115,232,0.16))',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative z-10 border-t border-white/10 py-5 gl-marquee-pause overflow-hidden">
          <div className="gl-marquee flex gap-10 whitespace-nowrap w-max">
            {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES.map((c) => c)].map((cat, i) => (
              <span key={i} className="text-sm font-mono text-[#8BA5C2] uppercase tracking-wider">
                {cat} <span className="text-white/20 mx-2">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="relative overflow-hidden bg-white dark:bg-transparent py-24 sm:py-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[28rem] gl-gradient opacity-[0.06] dark:opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal className="mb-16 max-w-2xl">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Cómo funciona</span>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-4 leading-[1.05]">
              Tres pasos, un camino claro.
            </h2>
          </Reveal>
          <div className="relative">
            <div className="hidden md:block absolute top-[1.9rem] left-0 right-0 h-px bg-gradient-to-r from-[#1E73E8] via-[#12C2A8] to-[#4CE07E] opacity-30" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 150}>
                  <div className="relative">
                    <p className="text-6xl sm:text-7xl font-display font-bold leading-none mb-6" style={{ color: step.accent }}>{step.n}</p>
                    <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-xl mb-2.5">{step.title}</h3>
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed max-w-xs">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP SHOWCASE */}
      <section id="roadmap" className="bg-white dark:bg-[#0A1830] border-y border-[#DDE4ED] dark:border-[#1C3254] py-20 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 items-center">
            <Reveal>
              <span className="text-[#1E73E8] text-xs font-mono font-semibold tracking-widest uppercase">Roadmap con IA</span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-3 mb-5 leading-tight">
                Un camino real,<br />no una lista de tareas.
              </h2>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed mb-6 max-w-md">
                Cada curso conectado a sus prerequisitos reales. Ves exactamente dónde estás parado y qué sigue —
                pasa el mouse sobre cualquier paso.
              </p>
              <Button variant="secondary" onClick={() => navigate('select-user')}>
                Genera el tuyo
              </Button>
            </Reveal>
            <Reveal delay={150}>
              <div className="bg-[#F7F9FA] dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-4 sm:p-6 shadow-xl shadow-[#1E73E8]/5 dark:shadow-none pointer-events-none select-none">
                <RoadmapGraph nodes={DEMO_ROADMAP_NODES} edges={DEMO_ROADMAP_EDGES} courses={mockCourses} onSelectCourse={() => {}} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* AUDIENCIAS */}
      <section id="publicadores" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#DDE4ED] dark:bg-[#1C3254] rounded-2xl overflow-hidden">
          {AUDIENCE.map((a, i) => (
            <Reveal key={a.key} delay={i * 150}>
              <div className="h-full relative overflow-hidden bg-[#0B1F3A] p-9 sm:p-12">
                <div className="gl-float absolute top-0 right-0 w-56 h-56 rounded-full opacity-15 blur-3xl translate-x-1/3 -translate-y-1/3" style={{ backgroundColor: a.accent }} />
                <span className="relative z-10 text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: a.accent }}>
                  {a.label}
                </span>
                <h3 className="relative z-10 text-3xl font-display font-bold text-white mt-4 mb-8 leading-[1.1] max-w-xs">{a.title}</h3>
                <ul className="relative z-10 space-y-4">
                  {a.points.map((p) => (
                    <li key={p} className="flex items-baseline gap-3 pl-4 border-l-2" style={{ borderColor: a.accent }}>
                      <span className="text-sm text-[#D1DCF0] leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRIVIA SHOWCASE */}
      <section id="trivia" className="relative overflow-hidden bg-[#0B1F3A] py-20 sm:py-28">
        <div className="gl-float absolute top-1/4 left-0 w-72 h-72 bg-[#12C2A8] opacity-10 rounded-full blur-3xl -translate-x-1/2" />
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Modo competitivo</span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mt-3 mb-5 leading-tight">
                Refuerza lo aprendido<br />compitiendo en vivo.
              </h2>
              <p className="text-[#8BA5C2] leading-relaxed mb-6 max-w-md">
                Crea una sala, comparte el código, y compite por puntaje con velocidad de respuesta. Leaderboard y
                podio animados, en tiempo real.
              </p>
              <Button variant="gradient" onClick={() => navigate('select-user')}>
                Entrar a una sala
              </Button>
            </Reveal>
            <Reveal delay={150} className="flex justify-center">
              <LiveLeaderboard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* TESTIMONIO */}
      <section className="relative overflow-hidden bg-[#F7F9FA] dark:bg-transparent py-20 sm:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mx-auto">
            <div className="relative overflow-hidden bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-3xl p-9 sm:p-12 text-center shadow-xl shadow-[#0B1F3A]/5 dark:shadow-none">
              <div className="absolute -top-6 -right-6 w-32 h-32 gl-gradient opacity-10 rounded-full blur-2xl" />
              <svg className="w-9 h-9 text-[#12C2A8]/30 mx-auto mb-5" fill="currentColor" viewBox="0 0 32 32">
                <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
              </svg>
              <p className="relative z-10 text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug mb-6">
                Pasé de no saber por dónde empezar a tener un camino claro, curso por curso. La trivia con mis
                compañeros fue lo que hizo que de verdad se me quedara.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full gl-gradient flex items-center justify-center text-white text-sm font-display font-bold shrink-0">
                  VR
                </div>
                <div className="text-left">
                  <p className="text-sm text-[#0B1F3A] dark:text-[#E2EBF6] font-semibold">Valentina Ríos</p>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Analista Junior · Grupo Financiero Norte</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <Reveal>
          <div className="gl-glow-teal relative overflow-hidden rounded-3xl bg-[#0B1F3A] px-6 sm:px-14 py-14 sm:py-20 text-center">
            <div className="gl-float absolute top-0 right-0 w-96 h-96 gl-gradient opacity-20 blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="gl-float absolute bottom-0 left-0 w-72 h-72 bg-[#12C2A8] opacity-10 blur-3xl -translate-x-1/3" style={{ animationDelay: '-3s' }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white leading-tight mb-5">
                Tu próximo salto<br /><span className="gl-gradient-text">empieza aquí.</span>
              </h2>
              <p className="text-[#8BA5C2] text-lg max-w-xl mx-auto mb-9">
                Sin tarjeta, sin fricción — elige un perfil de demostración y explora GrowLink ahora mismo.
              </p>
              <Button variant="gradient" size="lg" onClick={() => navigate('select-user')}>
                Probar GrowLink ahora
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#DDE4ED] dark:border-[#1C3254]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={logo} alt="GrowLink" className="h-6 w-auto object-contain" />
          <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">© {new Date().getFullYear()} GrowLink — Plataforma de crecimiento profesional.</p>
        </div>
      </footer>
    </div>
  );
}
