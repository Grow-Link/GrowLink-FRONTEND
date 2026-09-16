import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { TypeBadge } from '../components/Badge';
import type { OpportunityType } from '../types';

const OPPORTUNITY_TYPES: { value: OpportunityType; label: string; description: string }[] = [
  { value: 'course', label: 'Curso', description: 'Contenido educativo estructurado con modulos y certificacion' },
  { value: 'job', label: 'Empleo', description: 'Posicion laboral o colaboracion profesional remunerada' },
  { value: 'service', label: 'Servicio', description: 'Servicio profesional o consultoria especializada' },
];

const COMMISSION_RATE = 0.12;

export default function PublishOpportunityPage() {
  const [type, setType] = useState<OpportunityType>('course');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [spots, setSpots] = useState('');
  const [tags, setTags] = useState('');
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<{ min: number; max: number } | null>(null);

  const priceNum = parseFloat(price) || 0;
  const commission = priceNum * COMMISSION_RATE;
  const providerReceives = priceNum * (1 - COMMISSION_RATE);

  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

  function handleAIPriceSuggestion() {
    setLoadingPrice(true);
    setSuggestedPrice(null);
    setTimeout(() => {
      setLoadingPrice(false);
      const basePrice = type === 'course' ? 297 : type === 'service' ? 450 : 0;
      setSuggestedPrice({ min: Math.round(basePrice * 0.8), max: Math.round(basePrice * 1.3) });
    }, 1800);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8 lg:items-start">

          {/* Form */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel proveedor</span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">Publicar oportunidad</h1>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Llega a usuarios que buscan exactamente lo que ofreces gracias al matching de IA.</p>
            </div>

            {/* Type selector */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-4">Tipo de oportunidad</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {OPPORTUNITY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      type === t.value
                        ? 'border-[#1E73E8] bg-[#EFF6FF] dark:bg-[#0D1F3C]'
                        : 'border-[#DDE4ED] dark:border-[#1C3254] bg-[#F7F9FA] dark:bg-[#132A47] hover:border-[#1E73E8]/40'
                    }`}
                  >
                    <TypeBadge type={t.value} />
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-2 leading-snug">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-2">Detalles</h2>
              <Input
                label="Titulo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Curso intensivo de Machine Learning aplicado a Finanzas"
              />
              <div>
                <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Descripcion</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe que aprendera o ganara el usuario con esta oportunidad..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl text-sm text-[#0B1F3A] dark:text-[#E2EBF6] bg-white dark:bg-[#132A47] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/10 focus:border-[#1E73E8] transition-all resize-none"
                />
              </div>
              <Input
                label="Tags (separados por comas)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Python, Machine Learning, Finanzas, SQL"
              />
              {type !== 'job' && (
                <Input
                  label="Cupos disponibles"
                  type="number"
                  value={spots}
                  onChange={(e) => setSpots(e.target.value)}
                  placeholder="20"
                />
              )}
            </div>

            {/* Price + commission */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">Precio</h2>
                <button
                  onClick={handleAIPriceSuggestion}
                  disabled={loadingPrice}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1E73E8] border border-[#1E73E8]/30 hover:bg-[#EFF6FF] dark:hover:bg-[#0D1F3C] transition-all cursor-pointer disabled:opacity-60"
                >
                  {loadingPrice ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Sugerir precio con IA
                    </>
                  )}
                </button>
              </div>

              {suggestedPrice && (
                <div className="p-3.5 rounded-xl bg-[#EFF6FF] dark:bg-[#0D1F3C] border border-[#BFDBFE] dark:border-[#1C3254]">
                  <p className="text-xs font-semibold text-[#1E73E8] mb-1">Rango sugerido por IA</p>
                  <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">
                    ${suggestedPrice.min} — ${suggestedPrice.max} USD
                  </p>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Basado en oportunidades similares en la plataforma</p>
                  <button
                    onClick={() => setPrice(String(Math.round((suggestedPrice.min + suggestedPrice.max) / 2)))}
                    className="text-xs text-[#1E73E8] font-semibold mt-1.5 hover:underline cursor-pointer"
                  >
                    Usar precio medio
                  </button>
                </div>
              )}

              <Input
                label="Precio (USD)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="297"
                prefix={<span className="font-mono text-sm">$</span>}
              />

              {priceNum > 0 && (
                <div className="p-4 bg-[#F7F9FA] dark:bg-[#132A47] rounded-xl border border-[#DDE4ED] dark:border-[#1C3254] space-y-2.5">
                  <p className="text-xs font-semibold text-[#6B7A99] dark:text-[#8BA5C2] uppercase tracking-wider">Desglose de comision</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Precio total al usuario</span>
                    <span className="font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">${priceNum.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Comision GrowLink (12%)</span>
                    <span className="font-mono font-bold text-[#EF4444]">- ${commission.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-[#DDE4ED] dark:bg-[#1C3254]" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Recibes tu (88%)</span>
                    <span className="font-mono font-bold text-[#15803D] text-lg">${providerReceives.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={!title || !description || !price}
            >
              Publicar oportunidad
            </Button>
          </div>

          {/* Preview card */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Vista previa en marketplace</p>
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <TypeBadge type={type} />
                <span className="text-xs font-mono font-bold text-[#12C2A8]">-- % match</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] leading-snug">
                  {title || 'Titulo de la oportunidad'}
                </h3>
                <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-1 line-clamp-2 leading-relaxed">
                  {description || 'La descripcion de tu oportunidad aparecera aqui...'}
                </p>
              </div>

              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagList.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-[#F7F9FA] dark:bg-[#132A47] text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#EEF2F6] dark:border-[#1C3254]">
                <div>
                  <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">Tu nombre</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">5.0</span>
                    <span className="text-[#F59E0B] text-xs">★</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">
                    {priceNum > 0 ? `$${priceNum}` : '--'}
                  </p>
                  {type !== 'job' && spots && (
                    <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2]">{spots} cupos</p>
                  )}
                </div>
              </div>
            </div>

            {/* Commission summary */}
            {priceNum > 0 && (
              <div className="mt-4 bg-[#0B1F3A] rounded-xl p-4">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Tu ganancia estimada</p>
                <p className="text-3xl font-display font-bold text-white">${providerReceives.toFixed(0)}</p>
                <p className="text-xs text-[#8BA5C2] mt-0.5">por venta, despues de comision GrowLink</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
