import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { useNavigation } from '../store/NavigationContext';
import { listarPorPublicador } from '../services/cursosServiceApi';
import { agregarPregunta, type PreguntaAgregada } from '../services/triviaServiceApi';

// HU-23: el publicador suma preguntas al banco de la trivia, solo en áreas donde ya tiene cursos publicados
// (el servidor lo valida). La lista de la derecha es lo que se agregó en esta visita.
export default function TriviaQuestionFormPage() {
  const { currentUser, navigate } = useNavigation();

  const [categorias, setCategorias] = useState<string[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recienAgregada, setRecienAgregada] = useState(false);
  const [agregadas, setAgregadas] = useState<PreguntaAgregada[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    let ignorar = false;
    listarPorPublicador(Number(currentUser.id))
      .then((cursos) => {
        if (ignorar) return;
        const propias = [...new Set(cursos.filter((c) => c.status === 'active').map((c) => c.category))];
        setCategorias(propias);
        setCategory(propias[0] ?? '');
      })
      .catch((e: unknown) => {
        if (!ignorar) setErrorCarga(e instanceof Error ? e.message : 'No se pudieron cargar tus cursos.');
      });
    return () => {
      ignorar = true;
    };
  }, [currentUser]);

  const updateOption = (i: number, value: string) => setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  const opcionesDistintas = new Set(options.map((o) => o.trim().toLowerCase())).size === 4;
  const canSubmit = Boolean(category && question.trim().length >= 5 && options.every((o) => o.trim()) && opcionesDistintas && !guardando);

  async function handleSubmit() {
    if (!canSubmit) return;
    setGuardando(true);
    setError(null);
    try {
      const creada = await agregarPregunta({
        categoria: category,
        texto: question.trim(),
        opciones: options.map((o) => o.trim()),
        respuestaCorrecta: correctIndex,
      });
      setAgregadas((prev) => [creada, ...prev]);
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
      setRecienAgregada(true);
      window.setTimeout(() => setRecienAgregada(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la pregunta.');
    } finally {
      setGuardando(false);
    }
  }

  const cascara = (contenido: React.ReactNode) => (
    <div className="min-h-screen bg-[#F6F7F2] dark:bg-[#0E1815]">
      <Navbar />
      {contenido}
    </div>
  );

  if (errorCarga) {
    return cascara(
      <div className="max-w-lg mx-auto text-center px-4 py-24">
        <p className="text-[#DC2626] dark:text-[#F87171]">{errorCarga}</p>
      </div>
    );
  }

  if (categorias === null) return cascara(<p className="text-center text-sm text-[#6B7A74] dark:text-[#98B0A6] py-24">Cargando…</p>);

  if (categorias.length === 0) {
    return cascara(
      <div className="max-w-lg mx-auto text-center px-4 py-24">
        <h1 className="text-2xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mb-3">Publica un curso primero</h1>
        <p className="text-[#6B7A74] dark:text-[#98B0A6] mb-6">Solo puedes crear preguntas de trivia en áreas donde ya tienes cursos publicados.</p>
        <Button variant="primary" onClick={() => navigate('publish-course')}>Publicar un curso</Button>
      </div>
    );
  }

  return cascara(
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:items-start">
        <div className="space-y-6">
          <div>
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel publicador</span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">Preguntas de trivia</h1>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1">Agrega preguntas para las áreas donde tienes cursos publicados. Entran al banco y salen en las partidas.</p>
          </div>

          <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <label htmlFor="area-pregunta" className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] block mb-1.5">Área</label>
              <select id="area-pregunta" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#1A2C27] border-[#E1E6DF] dark:border-[#27403A] text-sm text-[#1F2D2A] dark:text-[#E6EFE9] outline-none focus:border-[#0E8A7D] cursor-pointer">
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="texto-pregunta" className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] block mb-1.5">Pregunta</label>
              <textarea
                id="texto-pregunta"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Escribe la pregunta…"
                className="w-full px-3.5 py-2.5 border border-[#E1E6DF] dark:border-[#27403A] rounded-xl text-sm text-[#1F2D2A] dark:text-[#E6EFE9] bg-white dark:bg-[#1A2C27] placeholder:text-[#6B7A74] dark:placeholder:text-[#98B0A6] focus:outline-none focus:ring-2 focus:ring-[#0E8A7D]/10 focus:border-[#0E8A7D] transition-all resize-none"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9]">Opciones — marca la correcta</p>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(i)}
                    aria-pressed={correctIndex === i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border-2 transition-all cursor-pointer ${correctIndex === i ? 'bg-[#4CE07E] border-[#4CE07E] text-white' : 'border-[#E1E6DF] dark:border-[#27403A] text-[#6B7A74] dark:text-[#98B0A6]'}`}
                    title="Marcar como correcta"
                  >
                    {['A', 'B', 'C', 'D'][i]}
                  </button>
                  <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opción ${i + 1}`} maxLength={255} className="flex-1" />
                </div>
              ))}
              {options.every((o) => o.trim()) && !opcionesDistintas && <p className="text-xs text-[#B45309] dark:text-[#FBBF24]">Las 4 opciones deben ser distintas.</p>}
            </div>

            {error && <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{error}</p>}
            <Button variant="gradient" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {guardando ? 'Guardando…' : recienAgregada ? '¡Pregunta agregada!' : 'Agregar pregunta'}
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] font-semibold uppercase tracking-wider mb-3">Agregadas en esta visita ({agregadas.length})</p>
          {agregadas.length === 0 ? (
            <div className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-5 text-sm text-[#6B7A74] dark:text-[#98B0A6]">Aún no has agregado preguntas.</div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {agregadas.map((q) => (
                <div key={q.id} className="bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] rounded-2xl p-4">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-[#E1E6DF] dark:border-[#27403A] text-[#6B7A74] dark:text-[#98B0A6] bg-[#F6F7F2] dark:bg-[#1A2C27]">{q.categoria}</span>
                  <p className="text-sm font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2 leading-snug">{q.texto}</p>
                  <p className="text-xs text-[#15803D] dark:text-[#4CE07E] mt-1.5">Correcta: {q.opciones[q.respuestaCorrecta]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
