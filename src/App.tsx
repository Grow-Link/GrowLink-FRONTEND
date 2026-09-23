import { NavigationProvider, useNavigation } from './store/NavigationContext';
import { ThemeProvider } from './store/ThemeContext';
import { AppDataProvider } from './store/AppDataContext';
import UserSelectPage from './pages/UserSelectPage';
import HomePage from './pages/HomePage';
import OnboardingPage from './pages/OnboardingPage';
import RoadmapPage from './pages/RoadmapPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import MyCoursesPage from './pages/MyCoursesPage';
import PublishCoursePage from './pages/PublishCoursePage';
import CompletedCoursesPage from './pages/CompletedCoursesPage';
import TriviaRoomPage from './pages/TriviaRoomPage';
import TriviaQuestionFormPage from './pages/TriviaQuestionFormPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';

function Router() {
  const { currentPage } = useNavigation();

  switch (currentPage) {
    case 'select-user': return <UserSelectPage />;
    case 'home': return <HomePage />;
    case 'onboarding': return <OnboardingPage />;
    case 'roadmap': return <RoadmapPage />;
    case 'catalog': return <CourseCatalogPage />;
    case 'course-detail': return <CourseDetailPage />;
    case 'my-courses': return <MyCoursesPage />;
    case 'publish-course': return <PublishCoursePage />;
    case 'completed-courses': return <CompletedCoursesPage />;
    case 'trivia': return <TriviaRoomPage />;
    case 'trivia-questions': return <TriviaQuestionFormPage />;
    case 'admin-dashboard': return <AdminDashboardPage />;
    case 'admin-courses': return <AdminCoursesPage />;
    case 'account-settings': return <AccountSettingsPage />;
    case 'public-profile': return <PublicProfilePage />;
    case 'subscription': return <SubscriptionPage />;
    default: return <UserSelectPage />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <NavigationProvider>
          <Router />
        </NavigationProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
