import { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { useNavigation } from '../store/NavigationContext';
import { useAppData } from '../store/AppDataContext';

export default function TriviaQuestionFormPage() {
  const { currentUser } = useNavigation();
  const { courses, triviaQuestions, addTriviaQuestion } = useAppData();

  const myCategories = [...new Set(courses.filter((c) => c.publisherId === currentUser?.id).map((c) => c.category))];

  const [category, setCategory] = useState(myCategories[0] ?? '');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const myQuestions = triviaQuestions.filter((q) => q.publisherId === currentUser?.id);

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  const canSubmit = category && question.trim() && options.every((o) => o.trim());

  function handleSubmit() {
    if (!canSubmit || !currentUser) return;
    addTriviaQuestion({
      category,
      question: question.trim(),
      options: options.map((o) => o.trim()) as [string, string, string, string],
      correctIndex,
      publisherId: currentUser.id,
    });
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  }

  if (myCategories.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
        <Navbar />
        <div className="max-w-lg mx-auto text-center px-4 py-24">
          <h1 className="text-2xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mb-3">Publica un curso primero</h1>
          <p className="text-[#6B7A99] dark:text-[#8BA5C2]">Solo puedes crear preguntas de trivia en categorías donde ya tienes cursos publicados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8 lg:items-start">
          <div className="space-y-6">
            <div>
              <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Panel publicador</span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">Preguntas de trivia</h1>
              <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1">Agrega preguntas para las categorías donde tienes cursos publicados.</p>
            </div>

            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 bg-white dark:bg-[#132A47] border-[#DDE4ED] dark:border-[#1C3254] text-sm text-[#0B1F3A] dark:text-[#E2EBF6] outline-none focus:border-[#1E73E8] cursor-pointer"
                >
                  {myCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] block mb-1.5">Pregunta</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="Escribe la pregunta..."
                  className="w-full px-3.5 py-2.5 border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl text-sm text-[#0B1F3A] dark:text-[#E2EBF6] bg-white dark:bg-[#132A47] placeholder:text-[#6B7A99] dark:placeholder:text-[#8BA5C2] focus:outline-none focus:ring-2 focus:ring-[#1E73E8]/10 focus:border-[#1E73E8] transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">Opciones — marca la correcta</p>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      onClick={() => setCorrectIndex(i)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border-2 transition-all cursor-pointer ${
                        correctIndex === i ? 'bg-[#4CE07E] border-[#4CE07E] text-white' : 'border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2]'
                      }`}
                      title="Marcar como correcta"
                    >
                      {['A', 'B', 'C', 'D'][i]}
                    </button>
                    <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Opción ${i + 1}`} className="flex-1" />
                  </div>
                ))}
              </div>

              <Button variant="gradient" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
                {justAdded ? 'Pregunta agregada' : 'Agregar pregunta'}
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Tus preguntas ({myQuestions.length})</p>
            {myQuestions.length === 0 ? (
              <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5 text-sm text-[#6B7A99] dark:text-[#8BA5C2]">
                Aún no has agregado preguntas.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {myQuestions.map((q) => (
                  <div key={q.id} className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] bg-[#F7F9FA] dark:bg-[#132A47]">{q.category}</span>
                    <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2 leading-snug">{q.question}</p>
                    <p className="text-xs text-[#15803D] dark:text-[#4CE07E] mt-1.5">Correcta: {q.options[q.correctIndex]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
