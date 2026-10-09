import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

const PREMIUM_BENEFITS = [
  {
    title: 'Roadmap más detallado',
    desc: 'Pasos más granulares, recursos específicos y tiempo estimado por tarea dentro de tu roadmap.',
  },
  {
    title: 'Regeneraciones de roadmap ilimitadas',
    desc: 'Actualiza tu roadmap cuantas veces necesites, sin restricciones mensuales.',
  },
  {
    title: 'Insignia destacada en trivia',
    desc: 'Tu perfil se distingue en el leaderboard y en las salas donde participas.',
  },
  {
    title: 'Salas de trivia sin límite',
    desc: 'Crea y únete a todas las salas de trivia que quieras, sin restricción diaria.',
  },
];

const TRANSACTIONS = [
  { date: '2026-08-01', description: 'Suscripción Premium — Agosto 2026', amount: '19.900', status: 'Pagado' },
  { date: '2026-07-01', description: 'Suscripción Premium — Julio 2026', amount: '19.900', status: 'Pagado' },
  { date: '2026-06-01', description: 'Suscripción Premium — Junio 2026', amount: '19.900', status: 'Pagado' },
  { date: '2026-05-01', description: 'Suscripción Premium — Mayo 2026', amount: '19.900', status: 'Pagado' },
];

export default function SubscriptionPage() {
  const [currentPlan] = useState<'free' | 'premium'>('premium');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const monthlyPrice = 19900;
  const annualMonthlyPrice = 15900;
  const displayPrice = billing === 'annual' ? annualMonthlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">

        {/* Header */}
        <div>
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Mi cuenta</span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-1">Plan y suscripción</h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">
            Plan actual: <span className="font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">{currentPlan === 'premium' ? 'Suscripción Premium' : 'Plan Gratuito'}</span>
          </p>
        </div>

        {/* Billing toggle — solo afecta precio Premium */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${billing === 'monthly' ? 'text-[#1F2D2A] dark:text-[#E6EFE9]' : 'text-[#6B7A74] dark:text-[#98B0A6]'}`}>
            Mensual
          </span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              billing === 'annual' ? 'bg-[#0E8A7D]' : 'bg-[#E1E6DF] dark:bg-[#27403A]'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className={`text-sm font-semibold ${billing === 'annual' ? 'text-[#1F2D2A] dark:text-[#E6EFE9]' : 'text-[#6B7A74] dark:text-[#98B0A6]'}`}>
            Anual
            <span className="ml-2 text-xs font-bold text-[#12C2A8] bg-[#CCFBF1] dark:bg-[#0D3830] px-1.5 py-0.5 rounded-full">
              Ahorra 20%
            </span>
          </span>
        </div>

        {/* Plan cards — 2 only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">

          {/* Gratuito */}
          <div className={`bg-white dark:bg-[#15231F] border-2 rounded-2xl p-6 sm:p-7 flex flex-col ${
            currentPlan === 'free'
              ? 'border-[#12C2A8]'
              : 'border-[#E1E6DF] dark:border-[#27403A]'
          }`}>
            {currentPlan === 'free' && (
              <span className="self-start px-2 py-0.5 rounded-full text-xs font-bold bg-[#F0FDF4] dark:bg-[#0D2E1A] text-[#15803D] border border-[#BBF7D0] dark:border-[#166534] mb-4">
                Plan actual
              </span>
            )}
            <div className="mb-6">
              <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-xl mb-1">Plan Gratuito</p>
              <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Acceso básico a la plataforma</p>
            </div>
            <p className="text-5xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-2">Gratis</p>
            <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mb-8">Sin tarjeta de crédito</p>

            <div className="mt-auto">
              {currentPlan === 'free' ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-[#F6F7F2] dark:bg-[#1A2C27] text-[#6B7A74] dark:text-[#98B0A6] border border-[#E1E6DF] dark:border-[#27403A]">
                  Plan actual
                </div>
              ) : (
                <Button variant="secondary" className="w-full">Cambiar a Gratuito</Button>
              )}
            </div>
          </div>

          {/* Premium */}
          <div className={`relative bg-[#1F2D2A] border-2 rounded-2xl p-6 sm:p-7 flex flex-col overflow-hidden ${
            currentPlan === 'premium'
              ? 'border-[#12C2A8]'
              : 'border-[#0E8A7D]'
          }`}>
            {/* Brand gradient accent */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full gl-gradient opacity-15 blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none" />

            {currentPlan === 'premium' && (
              <span className="self-start relative z-10 px-2 py-0.5 rounded-full text-xs font-bold bg-[#12C2A8]/20 text-[#12C2A8] border border-[#12C2A8]/40 mb-4">
                Plan actual
              </span>
            )}

            <div className="relative z-10 mb-6">
              <p className="font-display font-bold text-white text-xl mb-1">Suscripción Premium</p>
              <p className="text-sm text-[#98B0A6]">Para profesionales en crecimiento activo</p>
            </div>

            <div className="relative z-10 mb-2">
              <p className="text-5xl font-display font-bold text-white font-mono">
                ${displayPrice.toLocaleString('es-CO')}
                <span className="text-base font-body font-normal text-[#98B0A6] ml-1">COP/mes</span>
              </p>
            </div>
            {billing === 'annual' && (
              <p className="text-xs text-[#12C2A8] font-semibold mb-1 relative z-10">
                Facturado anualmente · ${(annualMonthlyPrice * 12).toLocaleString('es-CO')} COP/año
              </p>
            )}
            {billing === 'monthly' && (
              <p className="text-xs text-[#98B0A6] mb-1 relative z-10">Facturado mes a mes</p>
            )}

            {/* 4 benefits */}
            <ul className="relative z-10 mt-6 mb-8 space-y-3">
              {PREMIUM_BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full gl-gradient flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-snug">{benefit.title}</p>
                    <p className="text-xs text-[#98B0A6] mt-0.5 leading-relaxed">{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative z-10 mt-auto">
              {currentPlan === 'premium' ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-white/10 text-[#98B0A6] border border-white/20">
                  Plan actual
                </div>
              ) : (
                <Button variant="gradient" className="w-full">
                  Activar Premium
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl overflow-hidden max-w-3xl">
          <div className="p-5 sm:p-6 border-b border-[#E1E6DF] dark:border-[#27403A]">
            <h2 className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] text-xl">Historial de pagos</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-[#EDF1EA] dark:border-[#27403A]">
                {['Fecha', 'Descripción', 'Monto (COP)', 'Estado'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6B7A74] dark:text-[#98B0A6] uppercase tracking-wider px-6 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6F7F2] dark:divide-[#27403A]">
              {TRANSACTIONS.map((tx, i) => (
                <tr key={i} className="hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27] transition-colors">
                  <td className="px-6 py-4 text-xs text-[#6B7A74] dark:text-[#98B0A6] font-mono">{tx.date}</td>
                  <td className="px-6 py-4 text-sm text-[#1F2D2A] dark:text-[#E6EFE9] font-medium">{tx.description}</td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">${tx.amount}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F0FDF4] dark:bg-[#0D2E1A] text-[#15803D] dark:text-[#4CE07E] border border-[#BBF7D0] dark:border-[#166534]">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
