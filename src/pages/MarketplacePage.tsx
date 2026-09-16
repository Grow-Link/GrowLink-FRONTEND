import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Badge, { TypeBadge } from '../components/Badge';
import LiveIndicator from '../components/LiveIndicator';
import ProgressBar from '../components/ProgressBar';
import { useNavigation } from '../store/NavigationContext';
import { mockOpportunities } from '../services/mockData';
import type { OpportunityType, Opportunity } from '../types';

type Filter = 'all' | OpportunityType;
type SortBy = 'match' | 'price' | 'spots';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Cursos', value: 'course' },
  { label: 'Empleos', value: 'job' },
  { label: 'Servicios', value: 'service' },
];

const MATCH_TIERS: { label: string; value: number }[] = [
  { label: 'Todos', value: 0 },
  { label: '75% o más', value: 75 },
  { label: '90% o más', value: 90 },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Mejor match', value: 'match' },
  { label: 'Precio: menor a mayor', value: 'price' },
  { label: 'Más cupos disponibles', value: 'spots' },
];

function MatchBadge({ score }: { score: number }) {
  if (score >= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-white gl-gradient px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
        </svg>
        {score}%
      </span>
    );
  }
  const color = score >= 75 ? 'text-[#1E73E8]' : 'text-[#6B7A99] dark:text-[#8BA5C2]';
  return (
    <span className={`text-xs font-mono font-bold ${color}`}>{score}% match</span>
  );
}

function OpportunityCard({ opp, onSelect }: { opp: Opportunity; onSelect: () => void }) {
  const spotsRatio = opp.spotsLeft !== undefined && opp.totalSpots ? opp.spotsLeft / opp.totalSpots : null;
  const isUrgent = spotsRatio !== null && spotsRatio <= 0.3;

  return (
    <div
      onClick={onSelect}
      className={`gl-card-hover group bg-white dark:bg-[#0F2240] border rounded-2xl cursor-pointer hover:border-[#1E73E8]/40 flex flex-col gap-3 p-5 ${
        opp.featured ? 'border-[#1E73E8]/30 dark:border-[#1E73E8]/20' : 'border-[#DDE4ED] dark:border-[#1C3254]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={opp.type} />
          {opp.featured && (
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#12C2A8]/10 dark:bg-[#12C2A8]/15 text-[#0F766E] dark:text-[#2DD4BF] border border-[#12C2A8]/30">
              Destacado
            </span>
          )}
          {opp.isLive && <LiveIndicator />}
          {opp.isAuction && <Badge variant="warning">Subasta</Badge>}
        </div>
        <MatchBadge score={opp.matchScore} />
      </div>

      <div>
        <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug group-hover:text-[#1E73E8] transition-colors">
          {opp.title}
        </h3>
        <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1 line-clamp-2 leading-relaxed">{opp.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {opp.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#EEF2F6] dark:border-[#1C3254]">
        <div>
          <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">{opp.provider.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{opp.provider.rating}</span>
            <span className="text-[#F59E0B] text-xs">★</span>
            <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">({opp.provider.reviewCount})</span>
          </div>
        </div>
        <div className="text-right">
          {opp.isAuction ? (
            <div>
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">Oferta actual</p>
              <p className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">${opp.currentBid}</p>
            </div>
          ) : opp.price === 0 ? (
            <span className="text-sm font-semibold text-[#15803D] dark:text-[#4CE07E] bg-[#F0FDF4] dark:bg-[#0D2E1A] border border-[#BBF7D0] dark:border-[#166534] px-2 py-1 rounded-lg">Gratis</span>
          ) : (
            <div>
              {opp.originalPrice && (
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] line-through font-mono">${opp.originalPrice}</p>
              )}
              <p className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">${opp.price}</p>
            </div>
          )}
        </div>
      </div>

      {spotsRatio !== null && (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className={`text-xs font-semibold ${isUrgent ? 'text-[#DC2626]' : 'text-[#6B7A99] dark:text-[#8BA5C2]'}`}>
              {isUrgent ? `Solo ${opp.spotsLeft} cupos restantes` : `${opp.spotsLeft} de ${opp.totalSpots} disponibles`}
            </span>
          </div>
          <ProgressBar
            value={opp.totalSpots! - opp.spotsLeft!}
            max={opp.totalSpots!}
            variant={isUrgent ? 'blue' : 'teal'}
            size="xs"
          />
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const { navigate, userRole } = useNavigation();
  const [filter, setFilter] = useState<Filter>('all');
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>('match');
  const [search, setSearch] = useState('');
  const [showMatchAlert, setShowMatchAlert] = useState(true);

  const bySearch = mockOpportunities.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const filtered = bySearch.filter((o) => {
    const matchesFilter = filter === 'all' || o.type === filter;
    const matchesScore = o.matchScore >= minMatch;
    return matchesFilter && matchesScore;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'spots') return (b.spotsLeft ?? -1) - (a.spotsLeft ?? -1);
    return b.matchScore - a.matchScore;
  });

  const liveAuctions = bySearch.filter((o) => o.isAuction);

  const categoryCounts = (value: Filter) =>
    value === 'all' ? bySearch.length : bySearch.filter((o) => o.type === value).length;

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Match alert */}
        {showMatchAlert && (
          <div className="mb-6 relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[#0B1F3A]" />
            <div className="absolute right-0 top-0 w-64 h-full gl-gradient opacity-10 blur-xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 py-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="gl-bounce w-10 h-10 rounded-xl gl-gradient flex items-center justify-center shrink-0 gl-glow-teal">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <LiveIndicator label="MATCH ACTIVO" color="teal" size="md" />
                  </div>
                  <p className="text-sm text-white font-medium">
                    <span className="font-bold text-[#4CE07E]">3 nuevas oportunidades</span> coinciden con tu perfil y el paso 2 de tu roadmap
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={() => { setFilter('all'); setMinMatch(90); setSearch(''); }}
                  className="text-sm text-white font-semibold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all cursor-pointer border border-white/20"
                >
                  Ver matches
                </button>
                <button
                  onClick={() => setShowMatchAlert(false)}
                  className="text-[#8BA5C2] hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Provider CTA — only shown to users registered as Profesor / Proveedor */}
        {userRole === 'provider' && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#1E73E8]/25 bg-[#EFF6FF] dark:bg-[#0D1F3C] p-5">
            <div>
              <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">¿Tienes un curso o servicio para ofrecer?</p>
              <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Publícalo en el marketplace — te sugerimos el precio justo según el mercado y el matching de IA hace que te encuentren.</p>
            </div>
            <Button variant="gradient" onClick={() => navigate('publish-opportunity')} className="self-start sm:self-auto shrink-0">
              Publicar oportunidad
            </Button>
          </div>
        )}

        {/* Live auctions — surfaced separately so bidding stays visible */}
        {liveAuctions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <LiveIndicator label="SUBASTAS EN VIVO" color="teal" size="md" />
              <span className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{liveAuctions.length} activa{liveAuctions.length !== 1 ? 's' : ''} ahora</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveAuctions.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => navigate('auction', { opportunity: opp })}
                  className="gl-card-hover relative overflow-hidden rounded-2xl cursor-pointer bg-[#0B1F3A] p-5 group"
                >
                  <div className="gl-float absolute top-0 right-0 w-32 h-32 rounded-full gl-gradient opacity-15 blur-2xl translate-x-1/3 -translate-y-1/3" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="warning">Subasta</Badge>
                      <span className="text-xs font-mono font-bold text-[#4CE07E]">{opp.matchScore}% match</span>
                    </div>
                    <h3 className="font-display font-bold text-white leading-snug mb-3 group-hover:text-[#12C2A8] transition-colors">
                      {opp.title}
                    </h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-[#8BA5C2] font-mono">Oferta actual</p>
                        <p className="text-2xl font-display font-bold text-white">${opp.currentBid}</p>
                      </div>
                      <Button variant="gradient" size="sm">Ver puja</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar filters + grid */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 lg:sticky lg:top-24 space-y-6">
              <div>
                <p className="text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider mb-3">Categoría</p>
                <div className="space-y-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-left cursor-pointer transition-all ${
                        filter === f.value
                          ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white'
                          : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6]'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="font-mono text-xs opacity-70">{categoryCounts(f.value)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-[#EEF2F6] dark:border-[#1C3254]">
                <p className="text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider mb-3">Compatibilidad</p>
                <div className="space-y-1">
                  {MATCH_TIERS.map((tier) => (
                    <button
                      key={tier.value}
                      onClick={() => setMinMatch(tier.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left cursor-pointer transition-all ${
                        minMatch === tier.value
                          ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white'
                          : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${minMatch === tier.value ? 'bg-[#4CE07E]' : 'bg-[#DDE4ED] dark:bg-[#1C3254]'}`} />
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Search + sort row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div className="flex-1 sm:max-w-sm relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por titulo, habilidad o tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/20 focus:border-[#1E73E8] transition-all"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-3 py-2.5 rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#132A47] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/20"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] whitespace-nowrap">{sorted.length} resultado{sorted.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Uniform grid */}
            {sorted.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sorted.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opp={opp}
                    onSelect={() => navigate('opportunity-detail', { opportunity: opp })}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl">
                <p className="text-lg font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Sin resultados</p>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Prueba otro término de búsqueda o ajusta los filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
