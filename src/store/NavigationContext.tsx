import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate as useRouterNavigate, useLocation, matchPath } from 'react-router-dom';
import { mockOpportunities } from '../services/mockData';
import type { Page, Opportunity, UserRole } from '../types';

// Static route for pages that don't carry a dynamic id.
const PAGE_PATHS: Record<Page, string> = {
  auth: '/login',
  profile: '/perfil',
  goal: '/meta',
  roadmap: '/roadmap',
  marketplace: '/marketplace',
  'opportunity-detail': '/marketplace/oportunidad',
  auction: '/subasta',
  trivia: '/duelo',
  'admin-dashboard': '/admin/metricas',
  'admin-themes': '/admin/tematicas',
  'account-settings': '/cuenta',
  'public-profile': '/perfil-publico',
  'publish-opportunity': '/publicar',
  subscription: '/suscripcion',
};

// Checked in this order — the :id patterns must come before their static
// counterparts would otherwise conflict, though matchPath already requires
// a full match so order doesn't strictly matter here.
const ROUTE_PATTERNS: { page: Page; pattern: string }[] = [
  { page: 'opportunity-detail', pattern: '/marketplace/oportunidad/:id' },
  { page: 'auction', pattern: '/subasta/:id' },
  { page: 'auth', pattern: '/login' },
  { page: 'profile', pattern: '/perfil' },
  { page: 'goal', pattern: '/meta' },
  { page: 'roadmap', pattern: '/roadmap' },
  { page: 'marketplace', pattern: '/marketplace' },
  { page: 'trivia', pattern: '/duelo' },
  { page: 'admin-dashboard', pattern: '/admin/metricas' },
  { page: 'admin-themes', pattern: '/admin/tematicas' },
  { page: 'account-settings', pattern: '/cuenta' },
  { page: 'public-profile', pattern: '/perfil-publico' },
  { page: 'publish-opportunity', pattern: '/publicar' },
  { page: 'subscription', pattern: '/suscripcion' },
];

function resolvePage(pathname: string): Page {
  for (const { page, pattern } of ROUTE_PATTERNS) {
    if (matchPath(pattern, pathname)) return page;
  }
  return 'auth';
}

function resolveOpportunityId(pathname: string): string | null {
  const oppMatch = matchPath('/marketplace/oportunidad/:id', pathname);
  if (oppMatch?.params.id) return oppMatch.params.id;
  const auctionMatch = matchPath('/subasta/:id', pathname);
  if (auctionMatch?.params.id) return auctionMatch.params.id;
  return null;
}

interface NavigationContextValue {
  currentPage: Page;
  selectedOpportunity: Opportunity | null;
  hasActiveGoal: boolean;
  userRole: UserRole;
  isAuthenticated: boolean;
  navigate: (page: Page, data?: { opportunity?: Opportunity }) => void;
  goBack: () => void;
  canGoBack: boolean;
  setHasActiveGoal: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
  login: () => void;
  logout: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useRouterNavigate();
  const location = useLocation();
  const [hasActiveGoal, setHasActiveGoal] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [navCount, setNavCount] = useState(0);
  // Persisted per-tab so a page refresh doesn't force a re-login, but a new
  // tab/window (or closing this one) starts logged out — no real backend
  // session exists yet, so this is the frontend's own access gate.
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('gl_auth') === '1');

  useEffect(() => {
    sessionStorage.setItem('gl_auth', isAuthenticated ? '1' : '0');
  }, [isAuthenticated]);

  const currentPage = resolvePage(location.pathname);

  // Route guard: no direct URL access to app pages while logged out, and no
  // seeing the login screen while already logged in.
  useEffect(() => {
    if (location.pathname === '/') {
      routerNavigate('/login', { replace: true });
      return;
    }
    if (!isAuthenticated && currentPage !== 'auth') {
      routerNavigate('/login', { replace: true });
    } else if (isAuthenticated && currentPage === 'auth') {
      routerNavigate('/marketplace', { replace: true });
    }
  }, [location.pathname, currentPage, isAuthenticated, routerNavigate]);

  function login() {
    setIsAuthenticated(true);
  }

  function logout() {
    setIsAuthenticated(false);
    routerNavigate('/login', { replace: true });
  }

  const opportunityId = resolveOpportunityId(location.pathname);
  const selectedOpportunity = opportunityId
    ? mockOpportunities.find((o) => o.id === opportunityId) ?? null
    : null;

  function navigate(page: Page, data?: { opportunity?: Opportunity }) {
    let path = PAGE_PATHS[page];
    if (page === 'opportunity-detail' && data?.opportunity) {
      path = `${PAGE_PATHS['opportunity-detail']}/${data.opportunity.id}`;
    } else if (page === 'auction') {
      const id = data?.opportunity?.id ?? mockOpportunities.find((o) => o.isAuction)?.id;
      path = id ? `${PAGE_PATHS.auction}/${id}` : PAGE_PATHS.auction;
    }
    setNavCount((c) => c + 1);
    routerNavigate(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function goBack() {
    routerNavigate(-1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        selectedOpportunity,
        hasActiveGoal,
        userRole,
        isAuthenticated,
        navigate,
        goBack,
        canGoBack: navCount > 0,
        setHasActiveGoal,
        setUserRole,
        login,
        logout,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
