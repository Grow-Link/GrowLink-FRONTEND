import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { mockUser } from '../services/mockData';
import { TERMS_TEXT } from '../services/legalText';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-[#DDE4ED] dark:border-[#1C3254] last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{label}</p>
        {description && <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${
          checked ? 'bg-[#12C2A8]' : 'bg-[#DDE4ED] dark:bg-[#1C3254]'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}

export default function AccountSettingsPage() {
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState({
    matches: true,
    roadmap: true,
    auction: false,
    trivia: true,
    newsletter: false,
    marketing: false,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Mi cuenta</span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">Configuración de cuenta</h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Gestiona tus datos personales y preferencias.</p>
          </div>

          {/* Personal info */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-5">Información personal</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button variant="primary" onClick={handleSave}>
                  {saved ? 'Guardado' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-5">Cambiar contraseña</h2>
            <div className="space-y-4">
              <Input label="Contraseña actual" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nueva contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                <Input label="Confirmar nueva contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-[#EF4444] font-semibold">Las contraseñas no coinciden</p>
              )}
              <div className="flex justify-end">
                <Button variant="primary" disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>
                  Actualizar contraseña
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-1">Preferencias de notificación</h2>
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-5">Controla qué notificaciones recibes por email.</p>
            <div>
              <Toggle checked={notifs.matches} onChange={(v) => setNotifs((n) => ({ ...n, matches: v }))} label="Nuevos matches en marketplace" description="Te avisamos cuando hay oportunidades que coinciden con tu perfil" />
              <Toggle checked={notifs.roadmap} onChange={(v) => setNotifs((n) => ({ ...n, roadmap: v }))} label="Actualizaciones de roadmap" description="Cuando tu roadmap es regenerado o actualizado por IA" />
              <Toggle checked={notifs.auction} onChange={(v) => setNotifs((n) => ({ ...n, auction: v }))} label="Recordatorios de subasta" description="Alertas antes de que terminen subastas en las que participas" />
              <Toggle checked={notifs.trivia} onChange={(v) => setNotifs((n) => ({ ...n, trivia: v }))} label="Invitaciones a duelos de trivia" description="Cuando alguien te reta o hay un duelo nuevo disponible" />
              <Toggle checked={notifs.newsletter} onChange={(v) => setNotifs((n) => ({ ...n, newsletter: v }))} label="Newsletter semanal" description="Resumen de actividad y oportunidades destacadas" />
              <Toggle checked={notifs.marketing} onChange={(v) => setNotifs((n) => ({ ...n, marketing: v }))} label="Ofertas y promociones" description="Descuentos exclusivos para usuarios Premium" />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Términos y Condiciones</h2>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">Consulta los términos que aceptaste al registrarte en GrowLink.</p>
              </div>
              <span className="text-xs font-mono text-[#12C2A8] bg-[#CCFBF1] dark:bg-[#0D3830] px-2 py-1 rounded-lg shrink-0">Aceptados</span>
            </div>
            <div className="bg-[#F7F9FA] dark:bg-[#132A47] rounded-xl p-4 max-h-56 overflow-y-auto border border-[#DDE4ED] dark:border-[#1C3254]">
              <pre className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono leading-relaxed whitespace-pre-wrap">{TERMS_TEXT}</pre>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#EF4444]/30 rounded-2xl p-5 sm:p-6">
            <h2 className="font-display font-bold text-[#EF4444] text-lg mb-1">Zona de peligro</h2>
            <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-5">Las siguientes acciones son irreversibles. Procede con cuidado.</p>

            {!showDeleteConfirm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#EF4444]/20 bg-[#FEF2F2] dark:bg-[#1A0A0A]">
                <div>
                  <p className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Eliminar cuenta</p>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">Se eliminarán todos tus datos, roadmap y progreso de forma permanente.</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444] hover:text-white transition-all cursor-pointer"
                >
                  Eliminar cuenta
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#EF4444]/40 bg-[#FEF2F2] dark:bg-[#1A0A0A] space-y-4">
                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">
                  Para confirmar, escribe tu correo: <span className="text-[#EF4444]">{mockUser.email}</span>
                </p>
                <Input label="Correo electrónico" type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} placeholder={mockUser.email} />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteEmail(''); }}>Cancelar</Button>
                  <button
                    disabled={deleteEmail !== mockUser.email}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#EF4444] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-[#DC2626] transition-colors"
                  >
                    Confirmar eliminación de cuenta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
