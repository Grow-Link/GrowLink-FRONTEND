export type UserRole = 'user' | 'publisher' | 'admin';
export type Level = 'principiante' | 'intermedio' | 'avanzado';
export type CourseStatus = 'active' | 'inactive';
export type RoadmapNodeStatus = 'locked' | 'available' | 'current' | 'completed';
export type TriviaRoomStatus = 'lobby' | 'playing' | 'finished';

export interface SeedUser {
  id: string;
  name: string;
  role: UserRole;
  headline: string;
  org?: string;
}

export interface UserProfile {
  userId: string;
  goals: string;
  interests: string[];
  level: Level;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: Level;
  skills: string[];
  contentUrl: string;
  prerequisites: string[];
  publisherId: string;
  publisherName: string;
  status: CourseStatus;
  createdAt: string;
}

export interface RoadmapNode {
  id: string;
  courseId: string;
  tier: number;
  status: RoadmapNodeStatus;
}

export interface RoadmapEdge {
  from: string;
  to: string;
}

export interface Roadmap {
  id: string;
  userId: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  generatedAt: string;
}

export interface CourseCompletion {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  category: string;
  skillsUnlocked: string[];
  completedAt: string;
}

export interface TriviaQuestion {
  id: string;
  category: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  publisherId?: string;
}

export type TriviaQuestionCount = 5 | 10 | 15;
export type TriviaSecondsPerQuestion = 10 | 15 | 20;

export interface TriviaParticipant {
  id: string;
  name: string;
  score: number;
  streak: number;
  lastGain: number;
  isHost: boolean;
  isCurrentUser?: boolean;
}

export interface ConcurrencyPoint {
  time: string;
  activeUsers: number;
  activeTriviaRooms: number;
}

export interface MonthlyData {
  month: string;
  users: number;
  completions: number;
  coursesPublished: number;
}

export interface AdminMetrics {
  activeUsers: number;
  userGrowthPercent: number;
  roadmapCompletionRate: number;
  activeCourses: number;
  activeTriviaRoomsNow: number;
  peakConcurrentToday: number;
  monthlyData: MonthlyData[];
  concurrency: ConcurrencyPoint[];
  categoryDistribution: { category: string; count: number }[];
}

export type Page =
  | 'landing'
  | 'select-user'
  | 'home'
  | 'onboarding'
  | 'roadmap'
  | 'catalog'
  | 'course-detail'
  | 'my-courses'
  | 'publish-course'
  | 'completed-courses'
  | 'trivia'
  | 'trivia-questions'
  | 'admin-dashboard'
  | 'admin-courses'
  | 'account-settings'
  | 'public-profile'
  | 'subscription';
