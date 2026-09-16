export type UserRole = 'user' | 'provider';
export type GoalType = 'financial' | 'professional';
export type StepStatus = 'pending' | 'in_progress' | 'completed';
export type OpportunityType = 'course' | 'job' | 'service';

export interface Experience {
  company: string;
  role: string;
  years: number;
  current: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  year: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profileCompletion: number;
  skills: string[];
  currentIncome: number;
  experience: Experience[];
  education: Education[];
}

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  targetAmount?: number;
  targetRole?: string;
  deadline: string;
  currentProgress: number;
}

export interface RoadmapStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedWeeks: number;
  status: StepStatus;
  tags: string[];
}

export interface Roadmap {
  id: string;
  goalId: string;
  steps: RoadmapStep[];
  generatedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  provider: Provider;
  price: number;
  originalPrice?: number;
  spotsLeft?: number;
  totalSpots?: number;
  isAuction: boolean;
  auctionEndsAt?: string;
  currentBid?: number;
  tags: string[];
  matchScore: number;
  isLive?: boolean;
  featured?: boolean;
}

export interface Bid {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: string;
  isLeading?: boolean;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  isCurrentUser?: boolean;
  position: number;
}

export interface MonthlyData {
  month: string;
  users: number;
  completions: number;
  revenue: number;
}

export interface AdminMetrics {
  activeUsers: number;
  userGrowthPercent: number;
  goalAchievementRate: number;
  avgIncome: number;
  totalOpportunities: number;
  monthlyData: MonthlyData[];
}

export interface Tematica {
  id: string;
  name: string;
  description: string;
  opportunityCount: number;
  isActive: boolean;
  createdAt: string;
  category: string;
}

export type Page =
  | 'auth'
  | 'profile'
  | 'goal'
  | 'roadmap'
  | 'marketplace'
  | 'opportunity-detail'
  | 'auction'
  | 'trivia'
  | 'admin-dashboard'
  | 'admin-themes'
  | 'account-settings'
  | 'public-profile'
  | 'publish-opportunity'
  | 'subscription';
