import { NavigationProvider, useNavigation } from './store/NavigationContext';
import { ThemeProvider } from './store/ThemeContext';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import GoalPage from './pages/GoalPage';
import RoadmapPage from './pages/RoadmapPage';
import MarketplacePage from './pages/MarketplacePage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import AuctionPage from './pages/AuctionPage';
import TriviaDuelPage from './pages/TriviaDuelPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminThemesPage from './pages/AdminThemesPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import PublishOpportunityPage from './pages/PublishOpportunityPage';
import SubscriptionPage from './pages/SubscriptionPage';

function Router() {
  const { currentPage } = useNavigation();

  switch (currentPage) {
    case 'auth': return <AuthPage />;
    case 'profile': return <ProfilePage />;
    case 'goal': return <GoalPage />;
    case 'roadmap': return <RoadmapPage />;
    case 'marketplace': return <MarketplacePage />;
    case 'opportunity-detail': return <OpportunityDetailPage />;
    case 'auction': return <AuctionPage />;
    case 'trivia': return <TriviaDuelPage />;
    case 'admin-dashboard': return <AdminDashboardPage />;
    case 'admin-themes': return <AdminThemesPage />;
    case 'account-settings': return <AccountSettingsPage />;
    case 'public-profile': return <PublicProfilePage />;
    case 'publish-opportunity': return <PublishOpportunityPage />;
    case 'subscription': return <SubscriptionPage />;
    default: return <AuthPage />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <Router />
      </NavigationProvider>
    </ThemeProvider>
  );
}
