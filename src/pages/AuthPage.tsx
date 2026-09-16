import { useState } from 'react';
import logo from '../imports/logoGrowLink.png';
import { useNavigation } from '../store/NavigationContext';
import { useTheme } from '../store/ThemeContext';
import Button from '../components/Button';
import Input from '../components/Input';
import LiveIndicator from '../components/LiveIndicator';
import { TERMS_TEXT, PRIVACY_TEXT } from '../services/legalText';

type Mode = 'login' | 'register' | 'forgot';

function LegalModal({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE4ED] dark:border-[#1C3254] shrink-0">
          <h3 className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{title}</h3>
          <button onClick={onClose} className="text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer text-xl leading-none">×</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <pre className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono leading-relaxed whitespace-pre-wrap">{text}</pre>
        </div>
        <div className="p-4 border-t border-[#DDE4ED] dark:border-[#1C3254] shrink-0">
          <Button variant="secondary" className="w-full" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { navigate, setHasActiveGoal, setUserRole, login } = useNavigation();
  const { isDark, toggle } = useTheme();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<'user' | 'provider' | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <div className="min-h-screen flex relative">
      {/* Dark mode toggle — this page has no Navbar */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-20 w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] shadow-sm transition-all cursor-pointer"
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
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

      {/* Left panel — brand */}
      <div className="hidden lg:flex w-[44%] bg-[#0B1F3A] flex-col justify-between p-12 relative overflow-hidden">
        <div className="gl-float absolute top-0 right-0 w-80 h-80 rounded-full opacity-25 gl-gradient blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="gl-float absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-[#12C2A8] blur-2xl translate-y-1/3 -translate-x-1/4" style={{ animationDelay: '-3s' }} />
        <div className="gl-float absolute top-1/3 left-1/4 w-40 h-40 rounded-full opacity-10 bg-[#4CE07E] blur-2xl" style={{ animationDelay: '-5s' }} />

        {/* Logo — big and centered */}
        <div className="relative z-10 flex justify-center items-center py-4">
          <img src={logo} alt="GrowLink" className="h-44 w-auto max-w-[360px] object-contain drop-shadow-[0_0_48px_rgba(18,194,168,0.25)]" />
        </div>

        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Plataforma de crecimiento</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <LiveIndicator label="47 personas activas ahora" color="green" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white leading-[1.1] mb-6">
            Tu próximo salto<br />
            <span className="gl-gradient-text">empieza aquí.</span>
          </h1>
          <p className="text-[#8BA5C2] text-lg leading-relaxed max-w-sm">
            GrowLink conecta tus metas financieras y profesionales con oportunidades reales — seleccionadas por IA, disponibles ahora.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '14,800+', label: 'Usuarios activos', accent: '#1E73E8' },
            { value: '61%', label: 'Logran su meta', accent: '#12C2A8' },
            { value: '$4,150', label: 'Ingreso promedio', accent: '#4CE07E' },
          ].map((stat) => (
            <div key={stat.label} className="gl-card-hover relative overflow-hidden border border-white/10 rounded-xl p-4 bg-white/5 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: stat.accent }} />
              <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-xs text-[#8BA5C2] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-[#F7F9FA] dark:bg-[#081629]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <img src={logo} alt="GrowLink" className="h-12 w-auto max-w-[180px] object-contain mb-8 lg:hidden" />

          {mode === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Bienvenido de nuevo</h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1.5">Ingresa a tu cuenta para continuar tu roadmap.</p>
              </div>

              <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5 sm:p-6 space-y-4">
                <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" defaultValue="valentina@correo.com" />
                <Input label="Contraseña" type="password" placeholder="••••••••" defaultValue="••••••••" />

                <div className="flex justify-end">
                  <button
                    onClick={() => setMode('forgot')}
                    className="text-sm text-[#1E73E8] hover:underline cursor-pointer font-medium"
                  >
                    Olvidé mi contraseña
                  </button>
                </div>

                <Button variant="gradient" size="lg" className="w-full" onClick={() => { login(); navigate('marketplace'); }}>
                  Iniciar sesión
                </Button>
              </div>

              <p className="text-center text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                ¿No tienes cuenta?{' '}
                <button onClick={() => setMode('register')} className="text-[#1E73E8] font-semibold hover:underline cursor-pointer">
                  Regístrate gratis
                </button>
              </p>

              {/* Admin access — separate, subtle */}
              <div className="border-t border-[#DDE4ED] dark:border-[#1C3254] pt-4 text-center">
                <button
                  onClick={() => { login(); navigate('admin-dashboard'); }}
                  className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer transition-colors"
                >
                  Acceso de administrador
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Crear cuenta</h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1.5">Empieza gratis. Sin tarjeta de crédito.</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">Quiero unirme como</p>
                <div className="flex rounded-xl overflow-hidden border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240]">
                  {(['user', 'provider'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                        role === r
                          ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white'
                          : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]'
                      }`}
                    >
                      {r === 'user' ? 'Usuario' : 'Profesor / Proveedor'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5 sm:p-6 space-y-4">
                <Input label="Nombre completo" placeholder="Valentina Ríos" />
                <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" />
                <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" hint="Al menos 8 caracteres, una mayúscula y un número." />

                {/* Required T&C checkbox */}
                <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                  termsAccepted ? 'border-[#12C2A8] bg-[#F0FDFA] dark:bg-[#0D3830]' : 'border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47]'
                }`}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="accent-[#12C2A8] mt-0.5 shrink-0"
                  />
                  <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] leading-snug">
                    Acepto los{' '}
                    <span
                      onClick={(e) => { e.preventDefault(); setLegalModal('terms'); }}
                      className="text-[#1E73E8] font-semibold cursor-pointer hover:underline"
                    >
                      Términos y Condiciones
                    </span>
                    {' '}y la{' '}
                    <span
                      onClick={(e) => { e.preventDefault(); setLegalModal('privacy'); }}
                      className="text-[#1E73E8] font-semibold cursor-pointer hover:underline"
                    >
                      Política de Privacidad
                    </span>
                    {' '}de GrowLink.
                  </span>
                </label>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={!termsAccepted || !role}
                  onClick={() => { login(); setHasActiveGoal(false); if (role) setUserRole(role); navigate('profile'); }}
                >
                  Crear cuenta
                </Button>
              </div>

              <p className="text-center text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setMode('login')} className="text-[#1E73E8] font-semibold hover:underline cursor-pointer">
                  Inicia sesión
                </button>
              </p>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Recuperar acceso</h2>
                <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1.5">Te enviamos un enlace a tu correo para restablecer la contraseña.</p>
              </div>

              <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5 sm:p-6 space-y-4">
                {!forgotSent ? (
                  <>
                    <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" />
                    <Button variant="gradient" size="lg" className="w-full" onClick={() => setForgotSent(true)}>
                      Enviar enlace de recuperación
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-[#F0FDF4] dark:bg-[#0D2E1A] border-2 border-[#4CE07E] flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-[#15803D] dark:text-[#4CE07E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Revisa tu correo</p>
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1">El enlace de recuperación llega en menos de 2 minutos.</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer mx-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al login
              </button>
            </div>
          )}
        </div>
      </div>

      {legalModal === 'terms' && (
        <LegalModal title="Términos y Condiciones" text={TERMS_TEXT} onClose={() => setLegalModal(null)} />
      )}
      {legalModal === 'privacy' && (
        <LegalModal title="Política de Privacidad" text={PRIVACY_TEXT} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}
