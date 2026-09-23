import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  mockCourses,
  mockProfiles,
  mockRoadmaps,
  mockCompletions,
  mockTriviaQuestions,
} from '../services/mockData';
import type {
  Course,
  UserProfile,
  Roadmap,
  RoadmapNode,
  RoadmapEdge,
  RoadmapNodeStatus,
  CourseCompletion,
  TriviaQuestion,
  Level,
} from '../types';

const LEVEL_RANK: Record<Level, number> = { principiante: 0, intermedio: 1, avanzado: 2 };

interface PersistedState {
  courses: Course[];
  profiles: Record<string, UserProfile>;
  roadmaps: Record<string, Roadmap>;
  completions: CourseCompletion[];
  triviaQuestions: TriviaQuestion[];
}

const STORAGE_KEY = 'gl_app_data_v1';

function loadInitial(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    // fall through to seed defaults
  }
  return {
    courses: mockCourses,
    profiles: mockProfiles,
    roadmaps: mockRoadmaps,
    completions: mockCompletions,
    triviaQuestions: mockTriviaQuestions,
  };
}

function buildRoadmap(userId: string, courses: Course[], profile: UserProfile, completions: CourseCompletion[]): Roadmap {
  const maxRank = Math.min(2, LEVEL_RANK[profile.level] + 1);
  const byId = new Map(courses.map((c) => [c.id, c]));
  const completedIds = new Set(completions.filter((c) => c.userId === userId).map((c) => c.courseId));

  const included = new Set<string>();
  function includeWithPrereqs(courseId: string) {
    if (included.has(courseId)) return;
    const course = byId.get(courseId);
    if (!course || course.status !== 'active') return;
    included.add(courseId);
    course.prerequisites.forEach(includeWithPrereqs);
  }

  courses
    .filter((c) => c.status === 'active' && profile.interests.includes(c.category) && LEVEL_RANK[c.level] <= maxRank)
    .forEach((c) => includeWithPrereqs(c.id));

  const tierCache = new Map<string, number>();
  function tierOf(courseId: string): number {
    if (tierCache.has(courseId)) return tierCache.get(courseId)!;
    const course = byId.get(courseId);
    const prereqs = (course?.prerequisites ?? []).filter((p) => included.has(p));
    const tier = prereqs.length === 0 ? 0 : 1 + Math.max(...prereqs.map(tierOf));
    tierCache.set(courseId, tier);
    return tier;
  }

  const courseOrder = new Map(courses.map((c, i) => [c.id, i]));
  const orderedIds = [...included].sort((a, b) => {
    const t = tierOf(a) - tierOf(b);
    if (t !== 0) return t;
    return (courseOrder.get(a) ?? 0) - (courseOrder.get(b) ?? 0);
  });

  const nodes: RoadmapNode[] = [];
  let currentAssigned = false;
  for (const courseId of orderedIds) {
    const course = byId.get(courseId)!;
    const prereqs = course.prerequisites.filter((p) => included.has(p));
    let status: RoadmapNodeStatus;
    if (completedIds.has(courseId)) {
      status = 'completed';
    } else {
      const prereqsDone = prereqs.every((p) => completedIds.has(p));
      status = prereqsDone ? 'available' : 'locked';
    }
    nodes.push({ id: `n-${courseId}`, courseId, tier: tierOf(courseId), status });
  }
  for (const node of nodes) {
    if (node.status === 'available' && !currentAssigned) {
      node.status = 'current';
      currentAssigned = true;
    }
  }

  const edges: RoadmapEdge[] = [];
  for (const courseId of orderedIds) {
    const course = byId.get(courseId)!;
    course.prerequisites.filter((p) => included.has(p)).forEach((p) => edges.push({ from: p, to: courseId }));
  }

  return { id: `r-${userId}`, userId, nodes, edges, generatedAt: new Date().toISOString() };
}

interface AppDataContextValue {
  courses: Course[];
  profiles: Record<string, UserProfile>;
  roadmaps: Record<string, Roadmap>;
  completions: CourseCompletion[];
  triviaQuestions: TriviaQuestion[];
  getCourse: (id: string) => Course | undefined;
  getRelevance: (course: Course, userId: string | undefined) => number;
  saveProfile: (userId: string, profile: Omit<UserProfile, 'userId' | 'updatedAt'>) => void;
  generateRoadmap: (userId: string) => void;
  roadmapHasStaleCourse: (userId: string) => boolean;
  publishCourse: (input: Omit<Course, 'id' | 'status' | 'createdAt'>) => Course;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  setCourseStatus: (id: string, status: Course['status']) => void;
  completeCourse: (userId: string, courseId: string) => void;
  isCourseCompleted: (userId: string, courseId: string) => boolean;
  addTriviaQuestion: (input: Omit<TriviaQuestion, 'id'>) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitial);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getCourse = useCallback((id: string) => state.courses.find((c) => c.id === id), [state.courses]);

  const saveProfile = useCallback((userId: string, profile: Omit<UserProfile, 'userId' | 'updatedAt'>) => {
    setState((prev) => ({
      ...prev,
      profiles: { ...prev.profiles, [userId]: { ...profile, userId, updatedAt: new Date().toISOString() } },
    }));
  }, []);

  const generateRoadmap = useCallback((userId: string) => {
    setState((prev) => {
      const profile = prev.profiles[userId];
      if (!profile) return prev;
      const roadmap = buildRoadmap(userId, prev.courses, profile, prev.completions);
      return { ...prev, roadmaps: { ...prev.roadmaps, [userId]: roadmap } };
    });
  }, []);

  const getRelevance = useCallback(
    (course: Course, userId: string | undefined) => {
      const profile = userId ? state.profiles[userId] : undefined;
      if (!profile) return 50;
      let score = 30;
      if (profile.interests.includes(course.category)) score += 45;
      const rankDiff = Math.abs(LEVEL_RANK[course.level] - LEVEL_RANK[profile.level]);
      score += rankDiff === 0 ? 25 : rankDiff === 1 ? 10 : 0;
      return Math.min(100, score);
    },
    [state.profiles]
  );

  const roadmapHasStaleCourse = useCallback(
    (userId: string) => {
      const roadmap = state.roadmaps[userId];
      if (!roadmap) return false;
      return roadmap.nodes.some((n) => {
        if (n.status === 'completed') return false;
        const course = state.courses.find((c) => c.id === n.courseId);
        return !course || course.status !== 'active';
      });
    },
    [state.roadmaps, state.courses]
  );

  const publishCourse = useCallback((input: Omit<Course, 'id' | 'status' | 'createdAt'>) => {
    const course: Course = {
      ...input,
      id: `c-${Date.now().toString(36)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, courses: [...prev.courses, course] }));
    return course;
  }, []);

  const updateCourse = useCallback((id: string, patch: Partial<Course>) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const setCourseStatus = useCallback((id: string, status: Course['status']) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }, []);

  const isCourseCompleted = useCallback(
    (userId: string, courseId: string) => state.completions.some((c) => c.userId === userId && c.courseId === courseId),
    [state.completions]
  );

  const completeCourse = useCallback((userId: string, courseId: string) => {
    setState((prev) => {
      if (prev.completions.some((c) => c.userId === userId && c.courseId === courseId)) return prev;
      const course = prev.courses.find((c) => c.id === courseId);
      if (!course) return prev;
      const completion: CourseCompletion = {
        id: `cc-${Date.now().toString(36)}`,
        userId,
        courseId,
        courseTitle: course.title,
        category: course.category,
        skillsUnlocked: course.skills,
        completedAt: new Date().toISOString(),
      };
      const nextCompletions = [...prev.completions, completion];
      const profile = prev.profiles[userId];
      const nextRoadmaps = profile
        ? { ...prev.roadmaps, [userId]: buildRoadmap(userId, prev.courses, profile, nextCompletions) }
        : prev.roadmaps;
      return { ...prev, completions: nextCompletions, roadmaps: nextRoadmaps };
    });
  }, []);

  const addTriviaQuestion = useCallback((input: Omit<TriviaQuestion, 'id'>) => {
    setState((prev) => ({
      ...prev,
      triviaQuestions: [...prev.triviaQuestions, { ...input, id: `q-${Date.now().toString(36)}` }],
    }));
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        courses: state.courses,
        profiles: state.profiles,
        roadmaps: state.roadmaps,
        completions: state.completions,
        triviaQuestions: state.triviaQuestions,
        getCourse,
        getRelevance,
        saveProfile,
        generateRoadmap,
        roadmapHasStaleCourse,
        publishCourse,
        updateCourse,
        setCourseStatus,
        completeCourse,
        isCourseCompleted,
        addTriviaQuestion,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
