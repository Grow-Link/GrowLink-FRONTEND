import { useEffect, useState } from 'react';
import { obtenerDashboardConcurrencia, type DashboardConcurrencia } from '../services/metricasApi';

// HU-24: metricas reales de trivia-service, se vuelven a pedir cada 5 segundos.
const CADA_MS = 5000;

function Medidor({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    <div className="rounded-2xl border p-5 bg-white dark:bg-[#0F2240] border-[#DDE4ED] dark:border-[#1C3254] flex flex-col justify-between min-h-[110px]">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-[#6B7A99] dark:text-[#8BA5C2]">{etiqueta}</p>
      <div>
        <p className="text-3xl font-display font-bold font-mono tabular-nums text-[#0B1F3A] dark:text-[#E2EBF6]">{valor}</p>
        <p className="text-xs mt-1 text-[#6B7A99] dark:text-[#8BA5C2]">{detalle}</p>
      </div>
    </div>
  );
}

const ms = (valor: number | null) => (valor === null ? '—' : `${Math.round(valor)} ms`);

export default function ConcurrenciaEnVivo() {
  const [datos, setDatos] = useState<DashboardConcurrencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const nuevos = await obtenerDashboardConcurrencia();
        if (activo) {
          setDatos(nuevos);
          setError(null);
        }
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudieron cargar las métricas');
      }
    };
    cargar();
    const id = window.setInterval(cargar, CADA_MS);
    return () => {
      activo = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <section className="mb-8" aria-label="Concurrencia en tiempo real">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg">Concurrencia en tiempo real</h2>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2] text-sm">Datos reales de trivia-service, se actualizan cada 5 segundos</p>
        </div>
        {datos && (
          <span className="text-xs font-mono text-[#6B7A99] dark:text-[#8BA5C2]">
            {new Date(datos.generadoEn).toLocaleTimeString('es-CO')}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#EF4444] mb-3">
          {error}
        </p>
      )}

      {!datos && !error && <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">Cargando métricas...</p>}

      {datos && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Medidor
            etiqueta="Salas activas"
            valor={String(datos.salasActivas)}
            detalle={`${datos.salasEnCurso} en curso, ${datos.salasEnEspera} esperando`}
          />
          <Medidor etiqueta="Jugadores conectados" valor={String(datos.participantesConectados)} detalle="en salas que no han terminado" />
          <Medidor
            etiqueta="Latencia a la primera respuesta"
            valor={ms(datos.latenciaPromedioMs)}
            detalle="desde que sale la pregunta, en promedio"
          />
          <Medidor
            etiqueta="Empates resueltos"
            valor={String(datos.empatesResueltos)}
            detalle={`por el UPDATE atómico, ${datos.partidasFinalizadas} partidas terminadas`}
          />
        </div>
      )}
    </section>
  );
}
