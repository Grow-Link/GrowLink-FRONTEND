import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigation } from '../store/NavigationContext';
import { TERMS_TEXT } from '../services/legalText';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-[#E1E6DF] dark:border-[#27403A] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{label}</p>
        {description && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${
          checked ? 'bg-[#12C2A8]' : 'bg-[#E1E6DF] dark:bg-[#27403A]'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

const ROLE_LABEL = { user: 'Usuario', publisher: 'Publicador', admin: 'Administrador' } as const;

export default function AccountSettingsPage() {
  const { currentUser, logout } = useNavigation();
  const [notifs, setNotifs] = useState({
    courses: true,
    roadmap: true,
    trivia: true,
    newsletter: false,
  });

  if (!currentUser) return null;
  const initials = currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Mi cuenta</span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">Configuración de cuenta</h1>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">Este es un entorno de demostración — accedes seleccionando un perfil, sin contraseña.</p>
          </div>

          <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg mb-5">Perfil activo</h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl gl-gradient flex items-center justify-center text-white font-display font-bold shrink-0">{initials}</div>
              <div>
                <p className="font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{currentUser.name}</p>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">{ROLE_LABEL[currentUser.role]}{currentUser.org ? ` · ${currentUser.org}` : ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#E1E6DF] dark:border-[#27403A] text-[#1F2D2A] dark:text-[#E6EFE9] hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27] transition-all cursor-pointer"
            >
              Cambiar de usuario
            </button>
          </div>

          <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg mb-1">Preferencias de notificación</h2>
            <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mb-5">Controla qué notificaciones recibirías por email.</p>
            <div>
              <Toggle checked={notifs.courses} onChange={(v) => setNotifs((n) => ({ ...n, courses: v }))} label="Nuevos cursos en tus áreas de interés" description="Te avisamos cuando se publica un curso relevante para tu roadmap" />
              <Toggle checked={notifs.roadmap} onChange={(v) => setNotifs((n) => ({ ...n, roadmap: v }))} label="Actualizaciones de roadmap" description="Cuando tu roadmap se regenera o un curso deja de estar disponible" />
              <Toggle checked={notifs.trivia} onChange={(v) => setNotifs((n) => ({ ...n, trivia: v }))} label="Invitaciones a salas de trivia" description="Cuando te invitan a una sala o hay una nueva disponible" />
              <Toggle checked={notifs.newsletter} onChange={(v) => setNotifs((n) => ({ ...n, newsletter: v }))} label="Newsletter semanal" description="Resumen de actividad y cursos destacados" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-lg">Términos y Condiciones</h2>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-0.5">Consulta los términos de uso de la plataforma GrowLink.</p>
              </div>
            </div>
            <div className="bg-[#F6F7F2] dark:bg-[#1A2C27] rounded-xl p-4 max-h-56 overflow-y-auto border border-[#E1E6DF] dark:border-[#27403A]">
              <pre className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono leading-relaxed whitespace-pre-wrap">{TERMS_TEXT}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
