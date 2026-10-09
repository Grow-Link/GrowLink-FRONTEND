import { useEffect, useState } from 'react';
import Button from '../Button';
import { getSession } from '../../services/backendSession';
import {
  listarGanadores,
  listarMisPartidas,
  obtenerPartida,
  salonDeLaFama,
  type DetallePartida,
  type EntradaSalonDeLaFama,
  type MiPartida,
  type PartidaConPodio,
  type ResumenPartida,
} from '../../services/triviaServiceApi';

const MEDALLAS = ['🥇', '🥈', '🥉'];

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function duracion(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

/** Quién ha ganado: el salón de la fama, las últimas competencias con su podio y el detalle de cada una. */
export default function GanadoresPanel() {
  const session = getSession();
  const [salon, setSalon] = useState<EntradaSalonDeLaFama[] | null>(null);
  const [ultimas, setUltimas] = useState<PartidaConPodio[] | null>(null);
  const [mias, setMias] = useState<MiPartida[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<'todas' | 'mias'>('todas');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetallePartida | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vivo = true;
    setError(null);
    Promise.all([salonDeLaFama(5), listarGanadores(20), listarMisPartidas(20)])
      .then(([s, u, m]) => {
        if (!vivo) return;
        setSalon(s);
        setUltimas(u);
        setMias(m);
      })
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : 'No se pudo cargar el historial.'));
    return () => {
      vivo = false;
    };
  }, [recarga]);

  function alternar(codigo: string) {
    if (abierta === codigo) {
      setAbierta(null);
      setDetalle(null);
      return;
    }
    setAbierta(codigo);
    setDetalle(null);
    setCargandoDetalle(true);
    obtenerPartida(codigo)
      .then((d) => setDetalle(d))
      .catch(() => setDetalle(null))
      .finally(() => setCargandoDetalle(false));
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-[#FECACA] dark:border-[#4C1D1D] bg-[#FEF2F2] dark:bg-[#2A1111] p-6 text-center">
        <p className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => setRecarga((k) => k + 1)}>Reintentar</Button>
      </div>
    );
  }

  if (!salon || !ultimas || !mias) {
    return <div className="h-48 rounded-2xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] animate-pulse" />;
  }

  const lista: { partida: ResumenPartida; extra?: MiPartida }[] =
    vista === 'todas' ? ultimas.map((u) => ({ partida: u.partida })) : mias.map((m) => ({ partida: m.partida, extra: m }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#1F2D2A] to-[#0B6F65] p-5 sm:p-6">
        <h2 className="font-display font-bold text-white text-lg mb-3">🏆 Salón de la fama</h2>
        {salon.length === 0 ? (
          <p className="text-sm text-[#BCC9C2]">Todavía nadie ha ganado una partida. ¡Sé el primero!</p>
        ) : (
          <ol className="space-y-2">
            {salon.map((e, i) => (
              <li key={e.usuarioId} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${e.usuarioId === session?.usuarioId ? 'bg-[#F5A524]/25 ring-1 ring-[#F5A524]/60' : 'bg-white/10'}`}>
                <span className="w-7 text-center text-lg">{MEDALLAS[i] ?? i + 1}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{e.nombre}{e.usuarioId === session?.usuarioId && ' (tú)'}</span>
                <span className="text-xs text-[#BCC9C2] shrink-0">mejor: {e.mejorPuntaje} pts</span>
                <span className="text-sm font-bold text-[#F5D98B] shrink-0">{e.victorias} {e.victorias === 1 ? 'victoria' : 'victorias'}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-[#1F2D2A] dark:text-[#E6EFE9]">Competencias</h2>
          <div className="inline-flex rounded-lg border border-[#E1E6DF] dark:border-[#27403A] overflow-hidden text-xs font-semibold">
            {(['todas', 'mias'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setVista(v);
                  setAbierta(null);
                }}
                aria-pressed={vista === v}
                className={`px-3 py-1.5 cursor-pointer ${vista === v ? 'bg-[#0E8A7D] text-white' : 'bg-white dark:bg-[#15231F] text-[#6B7A74] dark:text-[#98B0A6]'}`}
              >
                {v === 'todas' ? 'Todas' : 'Mis partidas'}
              </button>
            ))}
          </div>
        </div>

        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E1E6DF] dark:border-[#27403A] p-8 text-center text-sm text-[#6B7A74] dark:text-[#98B0A6]">
            {vista === 'todas' ? 'Aún no se ha jugado ninguna partida.' : 'Todavía no has jugado partidas. Crea una sala o reta a alguien.'}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {lista.map(({ partida, extra }) => {
              const podio = ultimas.find((u) => u.partida.codigo === partida.codigo)?.podio;
              const esMiVictoria = partida.ganadorUsuarioId === session?.usuarioId;
              return (
                <li key={partida.codigo} className="rounded-2xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] overflow-hidden">
                  <button type="button" onClick={() => alternar(partida.codigo)} aria-expanded={abierta === partida.codigo} className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-[#F6F7F2] dark:hover:bg-[#1A2C27] transition-colors">
                    <span className="text-2xl shrink-0">{partida.ganadorNombre ? '🏆' : '🤝'}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">
                        {partida.ganadorNombre ? `${partida.ganadorNombre}${partida.empate ? ' (empate)' : ''}` : 'Sin ganador'}
                        {esMiVictoria && <span className="ml-2 text-[#B45309] dark:text-[#FBBF24]">¡Fuiste tú!</span>}
                      </span>
                      <span className="block text-xs text-[#6B7A74] dark:text-[#98B0A6] truncate">
                        {partida.categoria} · {partida.totalJugadores} jugadores · {partida.numPreguntas} preguntas · {fechaCorta(partida.finalizadaEn)}
                      </span>
                    </span>
                    {extra ? (
                      <span className="text-xs font-semibold text-[#0E8A7D] dark:text-[#5FD3C2] shrink-0">
                        Puesto {extra.miPosicion} · {extra.misPuntos} pts
                      </span>
                    ) : (
                      partida.ganadorNombre && <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6] shrink-0">{partida.puntosGanador} pts</span>
                    )}
                    <span aria-hidden="true" className={`text-[#6B7A74] transition-transform ${abierta === partida.codigo ? 'rotate-180' : ''}`}>⌄</span>
                  </button>

                  {abierta === partida.codigo && (
                    <div className="border-t border-[#E1E6DF] dark:border-[#27403A] px-4 py-4 bg-[#F6F7F2]/60 dark:bg-[#1A2C27]/40">
                      {cargandoDetalle && <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">Cargando el detalle…</p>}
                      {!cargandoDetalle && !detalle && podio && <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6]">No pudimos cargar el detalle completo.</p>}
                      {detalle && (
                        <>
                          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
                            {[
                              { v: String(detalle.partida.totalJugadores), l: 'jugadores' },
                              { v: String(detalle.partida.numPreguntas), l: 'preguntas' },
                              { v: `${detalle.partida.duracionPreguntaSegundos}s`, l: 'por pregunta' },
                              { v: duracion(detalle.partida.duracionTotalSegundos), l: 'duración total' },
                            ].map((d) => (
                              <div key={d.l} className="rounded-xl bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] py-2.5">
                                <dd className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">{d.v}</dd>
                                <dt className="text-[11px] text-[#6B7A74] dark:text-[#98B0A6]">{d.l}</dt>
                              </div>
                            ))}
                          </dl>
                          <ol className="space-y-1.5">
                            {detalle.ranking.map((p) => (
                              <li key={p.usuarioId} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${p.usuarioId === session?.usuarioId ? 'bg-[#12C2A8]/10' : 'bg-white dark:bg-[#15231F]'}`}>
                                <span className="w-6 text-center">{MEDALLAS[p.posicion - 1] ?? p.posicion}</span>
                                <span className="flex-1 truncate font-medium text-[#1F2D2A] dark:text-[#E6EFE9]">{p.nombre}</span>
                                <span className="text-xs text-[#6B7A74] dark:text-[#98B0A6]">{p.aciertos}/{detalle.partida.numPreguntas} aciertos</span>
                                <span className="font-mono font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">{p.puntos}</span>
                              </li>
                            ))}
                          </ol>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
