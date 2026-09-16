import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { mockUser, mockGoal } from '../services/mockData';

export default function PublicProfilePage() {
  const isOwnProfile = true;

  return (
    <div className="min-h-screen bg-[#F7F9FA] dark:bg-[#081629]">
      <Navbar />

      {/* Profile header band */}
      <div className="bg-[#0B1F3A] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 gl-gradient opacity-10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/3" />
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gl-gradient flex items-center justify-center text-white text-2xl sm:text-3xl font-display font-bold shrink-0">
              {mockUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{mockUser.name}</h1>
                {isOwnProfile ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">Tu perfil</span>
                ) : (
                  <Button variant="gradient" size="sm">Conectar</Button>
                )}
              </div>
              <p className="text-[#8BA5C2] mb-4">
                {mockUser.experience[0]?.role ?? 'Profesional'} — {mockUser.experience[0]?.company ?? ''}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-white">{mockUser.profileCompletion}%</p>
                  <p className="text-xs text-[#8BA5C2]">Perfil completo</p>
                </div>
                <div className="w-px h-8 bg-white/20 hidden sm:block" />
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-white">97%</p>
                  <p className="text-xs text-[#8BA5C2]">Match score</p>
                </div>
                <div className="w-px h-8 bg-white/20 hidden sm:block" />
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-white">{mockGoal.title.split(' ').slice(0, 3).join(' ')}...</p>
                  <p className="text-xs text-[#8BA5C2]">Meta activa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
          {/* Left: main profile content */}
          <div className="space-y-6">

            {/* Skills */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-4">Habilidades</h2>
              <div className="flex flex-wrap gap-2">
                {mockUser.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#F7F9FA] dark:bg-[#132A47] text-[#0B1F3A] dark:text-[#E2EBF6] border border-[#DDE4ED] dark:border-[#1C3254]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-5">Experiencia</h2>
              <div className="space-y-4">
                {mockUser.experience.map((exp, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2F6] dark:bg-[#132A47] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{exp.role}</p>
                        {exp.current && (
                          <span className="text-xs bg-[#F0FDF4] dark:bg-[#0D2E1A] text-[#15803D] border border-[#BBF7D0] dark:border-[#166534] px-2 py-0.5 rounded-md font-semibold">Actual</span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{exp.company}</p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5 font-mono">{exp.years} {exp.years === 1 ? 'ano' : 'anos'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-6">
              <h2 className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] text-lg mb-5">Educacion</h2>
              <div className="space-y-4">
                {mockUser.education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2F6] dark:bg-[#132A47] flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{edu.degree}</p>
                      <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{edu.institution}</p>
                      <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5 font-mono">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Profile completion */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Completitud de perfil</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">Progreso</span>
                <span className="font-mono font-bold text-[#0B1F3A] dark:text-[#E2EBF6]">{mockUser.profileCompletion}%</span>
              </div>
              <ProgressBar value={mockUser.profileCompletion} size="md" variant="gradient" />
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-2">Un perfil al 100% obtiene 3x mas matches</p>
            </div>

            {/* Active goal card */}
            <div className="bg-[#0B1F3A] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 gl-gradient opacity-10 blur-2xl translate-x-1/2 -translate-y-1/2" />
              <div className="relative z-10">
                <p className="text-xs text-[#8BA5C2] font-semibold uppercase tracking-wider mb-2">Meta activa</p>
                <p className="font-display font-bold text-white text-sm leading-snug mb-3">{mockGoal.title}</p>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#8BA5C2]">Progreso</span>
                  <span className="text-white font-mono font-bold">{mockGoal.currentProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full gl-gradient rounded-full" style={{ width: `${mockGoal.currentProgress}%` }} />
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-2xl p-5">
              <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] font-semibold uppercase tracking-wider mb-3">Estadisticas</p>
              <div className="space-y-3">
                {[
                  { label: 'Habilidades', value: String(mockUser.skills.length) },
                  { label: 'Anos de experiencia', value: String(mockUser.experience.reduce((a, e) => a + e.years, 0)) },
                  { label: 'Miembro desde', value: 'Sep 2024' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <p className="text-sm text-[#6B7A99] dark:text-[#8BA5C2]">{stat.label}</p>
                    <p className="font-mono font-bold text-sm text-[#0B1F3A] dark:text-[#E2EBF6]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
