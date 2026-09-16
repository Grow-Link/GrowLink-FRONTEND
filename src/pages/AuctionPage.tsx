import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import LiveIndicator from '../components/LiveIndicator';
import { useNavigation } from '../store/NavigationContext';
import { mockBids, mockOpportunities } from '../services/mockData';
import { useTimer } from '../hooks/useTimer';
import type { Bid } from '../types';

export default function AuctionPage() {
  const { navigate } = useNavigation();
  const opp = mockOpportunities.find((o) => o.isAuction) ?? mockOpportunities[2];
  const { formatted, seconds } = useTimer(847);
  const [bids, setBids] = useState<Bid[]>(mockBids);
  const [myBid, setMyBid] = useState('');
  const [bidError, setBidError] = useState('');
  const [justBid, setJustBid] = useState(false);

  const currentHighest = bids[0]?.amount ?? 340;
  const isUrgent = seconds < 120;
  const isVeryUrgent = seconds < 30;

  // Simulate incoming bids
  useEffect(() => {
    const names = ['Martín G.', 'Camila R.', 'Iván S.', 'Paloma T.', 'Emilio V.'];
    const interval = setInterval(() => {
      const newAmount = bids[0].amount + Math.floor(Math.random() * 15) + 5;
      const newBid: Bid = {
        id: String(Date.now()),
        userId: 'rx',
        userName: names[Math.floor(Math.random() * names.length)],
        amount: newAmount,
        timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isLeading: true,
      };
      setBids((prev) => [newBid, ...prev.slice(0, 7).map((b) => ({ ...b, isLeading: false }))]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  function handleBid() {
    const amount = Number(myBid);
    if (!amount || isNaN(amount)) {
      setBidError('Ingresa un monto válido');
      return;
    }
    if (amount <= currentHighest) {
      setBidError(`Tu oferta debe superar $${currentHighest}`);
      return;
    }
    setBidError('');
    const newBid: Bid = {
      id: String(Date.now()),
      userId: 'me',
      userName: 'Valentina R. (tú)',
      amount,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isLeading: true,
    };
    setBids((prev) => [newBid, ...prev.slice(0, 7).map((b) => ({ ...b, isLeading: false }))]);
    setMyBid('');
    setJustBid(true);
    setTimeout(() => setJustBid(false), 3000);
  }

  const timerColor = isVeryUrgent ? 'text-[#EF4444]' : isUrgent ? 'text-[#F59E0B]' : 'text-[#15803D] dark:text-[#4CE07E]';

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <LiveIndicator label="SUBASTA EN VIVO" color="teal" size="md" />
              <span className="text-[#6B7A99] dark:text-[#8BA5C2] text-xs font-mono">{bids.length + 12} participantes</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{opp.title}</h1>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm mt-1">{opp.provider.name}</p>
          </div>
          <button
            onClick={() => navigate('opportunity-detail', { opportunity: opp })}
            className="self-start text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] text-sm border border-[#DDE4ED] dark:border-[#1C3254] hover:border-[#1E73E8]/40 px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Ver detalles
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left — main auction info */}
          <div className="space-y-6">
            {/* Countdown + current price */}
            <div className={`rounded-2xl border p-5 sm:p-8 transition-all ${
              isVeryUrgent
                ? 'border-[#EF4444]/40 bg-[#EF4444]/5'
                : isUrgent
                ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5'
                : 'border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div>
                  <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-xs font-semibold uppercase tracking-widest font-mono mb-2">Oferta más alta</p>
                  <p className="text-5xl sm:text-7xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] font-mono tabular-nums leading-none">
                    ${bids[0]?.amount ?? currentHighest}
                    <span className="text-2xl font-body font-normal text-[#6B7A99] dark:text-[#8BA5C2] ml-2">USD</span>
                  </p>
                  <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm mt-2 font-medium">
                    Oferta de <span className="text-[#0B1F3A] dark:text-[#E2EBF6] font-semibold">{bids[0]?.userName}</span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-xs font-semibold uppercase tracking-widest font-mono mb-2">Tiempo restante</p>
                  <p className={`text-4xl sm:text-6xl font-mono font-bold tabular-nums leading-none ${timerColor} ${isVeryUrgent ? 'live-pulse' : ''}`}>
                    {formatted}
                  </p>
                  {isUrgent && (
                    <p className={`text-xs font-semibold mt-2 font-mono ${isVeryUrgent ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                      {isVeryUrgent ? 'ULTIMOS SEGUNDOS' : 'MENOS DE 2 MINUTOS'}
                    </p>
                  )}
                </div>
              </div>

              {/* Timer bar */}
              <div className="w-full h-2 bg-[#EEF2F6] dark:bg-[#1C3254] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isVeryUrgent ? 'bg-[#EF4444]' : isUrgent ? 'bg-[#F59E0B]' : 'gl-gradient'
                  }`}
                  style={{ width: `${(seconds / 847) * 100}%` }}
                />
              </div>
            </div>

            {/* My bid input */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              {justBid && (
                <div className="mb-4 p-3 bg-[#F0FDF4] dark:bg-[#0D2E1A] border border-[#4CE07E]/40 dark:border-[#166534] rounded-xl text-sm text-[#15803D] dark:text-[#4CE07E] font-semibold">
                  Tu oferta fue registrada. Ahora eres el postor líder.
                </div>
              )}
              <p className="text-[#0B1F3A] dark:text-[#E2EBF6] font-display font-bold text-lg mb-4">Hacer una oferta</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7A99] dark:text-[#8BA5C2] font-mono font-bold text-lg">$</span>
                  <input
                    type="number"
                    value={myBid}
                    onChange={(e) => { setMyBid(e.target.value); setBidError(''); }}
                    placeholder={String(currentHighest + 10)}
                    className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-[#F7F9FA] dark:bg-[#132A47] border border-[#DDE4ED] dark:border-[#1C3254] text-[#0B1F3A] dark:text-[#E2EBF6] text-2xl font-mono font-bold placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:border-[#12C2A8]/60 focus:ring-2 focus:ring-[#12C2A8]/20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleBid()}
                  />
                </div>
                <Button variant="gradient" size="lg" onClick={handleBid}>
                  Ofertar
                </Button>
              </div>
              {bidError && <p className="text-[#EF4444] text-xs mt-2 font-semibold">{bidError}</p>}
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-xs mt-2">
                Mínimo para superar: <span className="font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">${currentHighest + 1}</span>
              </p>

              {/* Quick bid buttons */}
              <div className="flex gap-2 mt-4">
                {[10, 25, 50].map((inc) => (
                  <button
                    key={inc}
                    onClick={() => setMyBid(String(currentHighest + inc))}
                    className="flex-1 py-2 rounded-lg border border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] hover:border-[#1E73E8]/40 text-xs font-mono font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    +${inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Valor de mercado', value: '$800 USD' },
                { label: 'Oferta inicial', value: '$150 USD' },
                { label: 'Total de pujas', value: String(bids.length + 12) },
              ].map((stat) => (
                <div key={stat.label} className="gl-card-hover bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl p-4">
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
                  <p className="text-xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] font-mono">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live feed */}
          <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#DDE4ED] dark:border-[#1C3254] flex items-center justify-between">
              <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Feed de pujas</p>
              <LiveIndicator label="EN TIEMPO REAL" color="teal" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[540px]">
              {bids.map((bid, i) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    i === 0 ? 'bid-enter gl-glow-teal bg-[#12C2A8]/10 border border-[#12C2A8]/30' : 'bg-[#F7F9FA] dark:bg-[#132A47] border border-[#EEF2F6] dark:border-[#1C3254]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {i === 0 && (
                      <div className="w-2 h-2 rounded-full bg-[#12C2A8] live-pulse shrink-0" />
                    )}
                    <div className={i !== 0 ? 'pl-5' : ''}>
                      <p className={`text-sm font-semibold ${i === 0 ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>
                        {bid.userName}
                        {i === 0 && ' — Líder'}
                      </p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-mono">{bid.timestamp}</p>
                    </div>
                  </div>
                  <p className={`font-mono font-bold text-lg ${i === 0 ? 'text-[#12C2A8]' : 'text-[#0B1F3A] dark:text-[#E2EBF6]'}`}>
                    ${bid.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
