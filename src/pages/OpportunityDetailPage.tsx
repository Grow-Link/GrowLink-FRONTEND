import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Badge, { TypeBadge } from '../components/Badge';
import LiveIndicator from '../components/LiveIndicator';
import ProgressBar from '../components/ProgressBar';
import { useNavigation } from '../store/NavigationContext';
import { mockOpportunities } from '../services/mockData';

export default function OpportunityDetailPage() {
  const { navigate, selectedOpportunity } = useNavigation();
  const opp = selectedOpportunity ?? mockOpportunities[0];

  const spotsUsed = opp.spotsLeft !== undefined && opp.totalSpots ? opp.totalSpots - opp.spotsLeft : 0;
  const spotsRatio = opp.totalSpots ? spotsUsed / opp.totalSpots : 0;

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2] mb-8">
          <button onClick={() => navigate('marketplace')} className="hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] cursor-pointer transition-colors">
            Marketplace
          </button>
          <span>/</span>
          <span className="text-[#0B1F3A] dark:text-[#E2EBF6] font-medium truncate">{opp.title.substring(0, 40)}...</span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8 lg:items-start">
          {/* Main content */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <TypeBadge type={opp.type} />
                {opp.isLive && <LiveIndicator />}
                {opp.isAuction && <Badge variant="warning">Subasta en vivo</Badge>}
                <span className="text-xs font-mono font-bold text-[#12C2A8]">{opp.matchScore}% match con tu perfil</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-tight mb-4">
                {opp.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {opp.provider.name}
                </span>
                {opp.provider.verified && (
                  <span className="flex items-center gap-1 text-[#15803D]">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Proveedor verificado
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="text-[#F59E0B]">★</span>
                  <strong className="text-[#0B1F3A] dark:text-[#E2EBF6]">{opp.provider.rating}</strong>
                  <span>({opp.provider.reviewCount} reseñas)</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-3">Sobre esta oportunidad</h2>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed">{opp.description}</p>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] leading-relaxed mt-3">
                Esta oportunidad fue seleccionada por el algoritmo de GrowLink porque tiene un {opp.matchScore}% de compatibilidad con tu perfil, habilidades actuales y el paso en curso de tu roadmap. Los proveedores en GrowLink son evaluados y verificados antes de listarse.
              </p>
            </div>

            {/* What you'll get */}
            <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Que incluye</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Acceso completo al contenido por 12 meses',
                  'Certificado de finalizacion verificado',
                  'Acceso a comunidad privada de ex-alumnos',
                  'Sesiones de Q&A con instructores en vivo',
                  'Proyectos practicos con feedback personalizado',
                  'Garantia de satisfaccion de 30 dias',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                    <div className="w-4 h-4 rounded-full bg-[#F0FDF4] dark:bg-[#0D2E1A] border border-[#BBF7D0] dark:border-[#166534] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#15803D]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Requisitos previos</h2>
              <ul className="space-y-2 text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                {['Conocimientos basicos de Python o disposicion para aprenderlo', 'Ingles intermedio para lectura tecnica', 'Computadora con al menos 8GB de RAM'].map((req) => (
                  <li key={req} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DDE4ED] dark:bg-[#1C3254] mt-2 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar — premium dark brand treatment */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Action panel with dark navy + gradient accent */}
            <div className="relative overflow-hidden rounded-2xl">
              {/* Gradient accent bar */}
              <div className="h-1.5 w-full gl-gradient" />
              <div className="bg-[#0B1F3A] p-6">
                <div className="absolute top-0 right-0 w-48 h-48 gl-gradient opacity-10 blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10">
                  {opp.isAuction ? (
                    <>
                      <div className="mb-5">
                        <p className="text-xs text-[#8BA5C2] uppercase tracking-wider font-semibold mb-1">Oferta actual</p>
                        <p className="text-5xl font-display font-bold text-white font-mono">${opp.currentBid}</p>
                        <div className="mt-2"><LiveIndicator label="SUBASTA EN VIVO" color="teal" size="md" /></div>
                      </div>
                      <Button variant="gradient" size="lg" className="w-full" onClick={() => navigate('auction', { opportunity: opp })}>
                        Ver puja en vivo
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-5">
                        {opp.originalPrice && (
                          <p className="text-sm text-[#8BA5C2] line-through font-mono">${opp.originalPrice} USD</p>
                        )}
                        <p className="text-5xl font-display font-bold text-white">
                          {opp.price === 0 ? 'Gratis' : `$${opp.price}`}
                          {opp.price > 0 && <span className="text-lg font-body font-normal text-[#8BA5C2] ml-2">USD</span>}
                        </p>
                        {opp.originalPrice && opp.price > 0 && (
                          <span className="text-sm text-[#4CE07E] font-semibold">
                            Ahorro: ${opp.originalPrice - opp.price} ({Math.round((1 - opp.price / opp.originalPrice) * 100)}% descuento)
                          </span>
                        )}
                      </div>
                      <Button variant="gradient" size="lg" className="w-full">
                        Reservar cupo
                      </Button>
                    </>
                  )}

                  {opp.spotsLeft !== undefined && (
                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8BA5C2]">{opp.spotsLeft} cupos disponibles</span>
                        <span className="font-semibold text-white">{opp.totalSpots} total</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${spotsRatio > 0.7 ? 'bg-[#EF4444]' : 'bg-[#12C2A8]'}`}
                          style={{ width: `${(spotsUsed / (opp.totalSpots ?? 1)) * 100}%` }}
                        />
                      </div>
                      {spotsRatio > 0.7 && (
                        <p className="text-xs text-[#EF4444] font-semibold">Pocas plazas — alta demanda</p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 pt-5 border-t border-white/10 space-y-2.5 text-xs text-[#8BA5C2]">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Garantia de devolucion 30 dias
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      Pago seguro · SSL
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-[#0F2240] rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] p-5">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider font-semibold mb-3">Habilidades que desarrollaras</p>
              <div className="flex flex-wrap gap-1.5">
                {opp.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254] font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Match explanation */}
            <div className="bg-[#EFF6FF] dark:bg-[#0D1F3C] rounded-2xl border border-[#BFDBFE] dark:border-[#1C3254] p-5">
              <p className="text-xs text-[#1E73E8] uppercase tracking-wider font-semibold mb-2">Por que es un match</p>
              <p className="text-sm text-[#1E40AF] dark:text-[#93C5FD] leading-relaxed">
                Esta oportunidad coincide con tus habilidades en {opp.tags.slice(0, 2).join(' y ')} y esta alineada con el paso 2 de tu roadmap activo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
