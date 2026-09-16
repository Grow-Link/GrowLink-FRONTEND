import { useState, useRef, useEffect } from 'react';
import logo from '../imports/logoGrowLink.png';
import { useNavigation } from '../store/NavigationContext';
import { useTheme } from '../store/ThemeContext';
import { mockUser } from '../services/mockData';
import type { Page } from '../types';

const USER_NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Roadmap', page: 'roadmap' },
  { label: 'Marketplace', page: 'marketplace' },
  { label: 'Mi Meta', page: 'goal' },
  { label: 'Duelo', page: 'trivia' },
];

const PROVIDER_NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Roadmap', page: 'roadmap' },
  { label: 'Marketplace', page: 'marketplace' },
  { label: 'Publicar', page: 'publish-opportunity' },
  { label: 'Duelo', page: 'trivia' },
];

const ADMIN_NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Métricas', page: 'admin-dashboard' },
  { label: 'Temáticas', page: 'admin-themes' },
];

const ADMIN_PAGES: Page[] = ['admin-dashboard', 'admin-themes'];

const DROPDOWN_ITEMS: { label: string; page: Page }[] = [
  { label: 'Ver perfil', page: 'public-profile' },
  { label: 'Editar perfil', page: 'profile' },
  { label: 'Configuración', page: 'account-settings' },
  { label: 'Suscripción', page: 'subscription' },
];

export default function Navbar() {
  const { navigate, goBack, canGoBack, currentPage, userRole, logout } = useNavigation();
  const { isDark, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdminSection = ADMIN_PAGES.includes(currentPage);
  const links = isAdminSection
    ? ADMIN_NAV_LINKS
    : userRole === 'provider'
    ? PROVIDER_NAV_LINKS
    : USER_NAV_LINKS;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  function handleNavigate(page: Page) {
    navigate(page);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }

  const initials = mockUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#0F2240] border-b border-[#DDE4ED] dark:border-[#1C3254]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Back — in-app history, doesn't depend on the browser */}
          {canGoBack && (
            <button
              onClick={goBack}
              title="Volver"
              aria-label="Volver a la página anterior"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <button
            onClick={() => handleNavigate('marketplace')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={logo} alt="GrowLink" className="h-7 sm:h-8 w-auto max-w-[120px] sm:max-w-[140px] object-contain" />
          </button>
        </div>

        {/* Nav links — desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <button
              key={link.page}
              onClick={() => handleNavigate(link.page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPage === link.page
                  ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white'
                  : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]'
              }`}
            >
              {link.label}
            </button>
          ))}

          {isAdminSection && (
            <button
              onClick={() => handleNavigate('marketplace')}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] hover:border-[#0B1F3A] dark:hover:border-[#8BA5C2] transition-all cursor-pointer"
            >
              Volver a la app
            </button>
          )}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] transition-all cursor-pointer"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full gl-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6] leading-none">{mockUser.name}</p>
                <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] mt-0.5">{isAdminSection ? 'Administrador' : 'Plan Pro'}</p>
              </div>
              <svg className="hidden md:block w-3.5 h-3.5 text-[#6B7A99] dark:text-[#8BA5C2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-2 space-y-0.5">
                  {DROPDOWN_ITEMS.map((item) => (
                    <button
                      key={item.page}
                      onClick={() => handleNavigate(item.page)}
                      className="w-full text-left px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#E2EBF6] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] rounded-lg transition-colors cursor-pointer font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                  <div className="h-px bg-[#DDE4ED] dark:bg-[#1C3254] my-1" />
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1111] rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7A99] dark:text-[#8BA5C2] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] transition-all cursor-pointer"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Nav links — mobile panel */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-[#DDE4ED] dark:border-[#1C3254] px-4 py-3 space-y-1">
          {links.map((link) => (
            <button
              key={link.page}
              onClick={() => handleNavigate(link.page)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPage === link.page
                  ? 'bg-[#0B1F3A] dark:bg-[#1C3254] text-white'
                  : 'text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] hover:bg-[#F7F9FA] dark:hover:bg-[#132A47]'
              }`}
            >
              {link.label}
            </button>
          ))}
          {isAdminSection && (
            <button
              onClick={() => handleNavigate('marketplace')}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-[#6B7A99] dark:text-[#8BA5C2] border border-[#DDE4ED] dark:border-[#1C3254] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] transition-all cursor-pointer"
            >
              Volver a la app
            </button>
          )}
          <div className="h-px bg-[#DDE4ED] dark:bg-[#1C3254] my-2" />
          <p className="px-4 text-sm font-semibold text-[#0B1F3A] dark:text-[#E2EBF6]">{mockUser.name}</p>
        </nav>
      )}
    </header>
  );
}
