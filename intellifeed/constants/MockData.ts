export type ContentSource = 'interest' | 'social' | 'followed' | 'trending';
export type ContentType = 'article' | 'podcast' | 'research' | 'book' | 'insight';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceAvatar: string;
  category: string;
  categoryColor: string;
  readTime: number;
  podcastDuration?: number;
  image: string;
  contentSource: ContentSource;
  contentType: ContentType;
  likes: number;
  saves: number;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  tags: string[];
  friendsWhoRead?: string[];
  trendingScore?: number;
}

export interface PlanItem {
  id: string;
  title: string;
  sourceItem: string;
  category: string;
  categoryColor: string;
  steps: PlanStep[];
  progress: number;
  createdAt: string;
  dueDate?: string;
  type: 'learning' | 'fitness' | 'reading' | 'research' | 'habit';
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  type: 'task' | 'buy' | 'read' | 'watch' | 'practice';
  link?: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  members: number;
  image: string;
  isJoined: boolean;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredScore: number;
  currentChallenge?: string;
  weeklyActivity: number;
  tags: string[];
}

export interface KnowledgeNode {
  id: string;
  label: string;
  score: number;
  color: string;
  children?: KnowledgeNode[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  avatar: string;
  joinedDate: string;
  totalScore: number;
  weeklyStreak: number;
  articlesRead: number;
  podcastsListened: number;
  booksCompleted: number;
  plansCompleted: number;
  knowledgeTree: KnowledgeNode[];
  badges: Badge[];
  following: number;
  followers: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: string;
}

// Modern Thinker accent palette — saturated yet refined; legible on white
const TAG_COLORS = {
  science: '#0E7490',     // Teal
  ai: '#1E40AF',          // Deep Blue
  business: '#7C3AED',    // Royal Purple
  philosophy: '#B45309',  // Warm Ochre
  fitness: '#B91C1C',     // Crimson
  geopolitics: '#15803D', // Forest Green
  health: '#059669',      // Emerald
  psychology: '#A16207',  // Amber Brown
};

// ─── FEED DATA ───────────────────────────────────────────────────────────────

export const FEED_ITEMS: FeedItem[] = [
  {
    id: 'f1',
    title: 'How REM Sleep Shapes Learning and Creative Synthesis — New Findings from Stanford',
    summary:
      'A landmark study from Stanford reveals that REM sleep consolidates emotional memory and forges unexpected connections between disparate concepts. Subjects with eight hours of uninterrupted REM solved creative problems 40% more effectively than those whose sleep was fragmented mid-cycle.',
    source: 'Stanford Sleep Lab',
    sourceAvatar: '◆',
    category: 'Science',
    categoryColor: TAG_COLORS.science,
    readTime: 6,
    podcastDuration: 480,
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80',
    contentSource: 'followed',
    contentType: 'research',
    likes: 1243,
    saves: 387,
    isLiked: false,
    isSaved: false,
    timestamp: '2 hours ago',
    tags: ['Sleep', 'Neuroscience', 'Learning', 'Creativity'],
    trendingScore: 94,
  },
  {
    id: 'f2',
    title: 'The AI Model Predicting Cardiac Events Seven Years in Advance — 90% Accuracy',
    summary:
      'DeepMind\'s latest healthcare model analyzes retinal imagery and ECG patterns to forecast myocardial infarction years before symptoms appear. Published in Nature Medicine, the study spans 500,000 patients across 40 countries — a milestone in preventive cardiology.',
    source: 'DeepMind Health',
    sourceAvatar: '◇',
    category: 'AI',
    categoryColor: TAG_COLORS.ai,
    readTime: 8,
    podcastDuration: 720,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    contentSource: 'trending',
    contentType: 'research',
    likes: 5821,
    saves: 2103,
    isLiked: true,
    isSaved: true,
    timestamp: '4 hours ago',
    tags: ['AI', 'Medicine', 'Cardiology', 'Prediction'],
    trendingScore: 99,
  },
  {
    id: 'f3',
    title: 'The Reading Habits of Munger, Buffett, and Gates — What the Architects of Capital Share',
    summary:
      'An analysis of 200 biographies of leading entrepreneurs reveals that 88% read at least thirty minutes daily, deliberately outside their primary discipline. Buffett dedicates 80% of his working hours to reading: "The more you read, the more frameworks you have for solving problems."',
    source: 'The Deep Reader',
    sourceAvatar: '◈',
    category: 'Business',
    categoryColor: TAG_COLORS.business,
    readTime: 5,
    podcastDuration: 360,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    contentSource: 'social',
    contentType: 'article',
    likes: 892,
    saves: 441,
    isLiked: false,
    isSaved: true,
    timestamp: '6 hours ago',
    tags: ['Reading', 'Habits', 'Entrepreneurship', 'Mastery'],
    friendsWhoRead: ['Daniel R.', 'Sofia K.', 'Michael A.'],
  },
  {
    id: 'f4',
    title: 'Zone 2 Training: The Cellular Science Behind Low-Intensity Endurance',
    summary:
      'Peter Attia and Andrew Huberman examine why 80% of endurance training should occur in Zone 2 — the conversational heart rate. Recent research demonstrates mitochondrial biogenesis, a 23% reduction in visceral fat, and substantial improvements in insulin sensitivity.',
    source: 'Peter Attia — The Drive',
    sourceAvatar: '◉',
    category: 'Performance',
    categoryColor: TAG_COLORS.fitness,
    readTime: 7,
    podcastDuration: 1200,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    contentSource: 'interest',
    contentType: 'podcast',
    likes: 2341,
    saves: 876,
    isLiked: false,
    isSaved: false,
    timestamp: '1 day ago',
    tags: ['Longevity', 'Zone 2', 'Endurance', 'Mitochondria'],
  },
  {
    id: 'f5',
    title: 'Modern Stoicism: How Marcus Aurelius Would Confront the Smartphone Age',
    summary:
      'A philosophical reading of the Meditations uncovers surprising principles for managing digital distraction. "Those who chase every passing trend are like sleepwalkers" — a reflection on notification-driven consciousness and the architecture of attention.',
    source: 'Daily Stoic',
    sourceAvatar: '◊',
    category: 'Philosophy',
    categoryColor: TAG_COLORS.philosophy,
    readTime: 9,
    podcastDuration: 540,
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80',
    contentSource: 'followed',
    contentType: 'article',
    likes: 1567,
    saves: 623,
    isLiked: false,
    isSaved: false,
    timestamp: '1 day ago',
    tags: ['Stoicism', 'Attention', 'Mindfulness', 'Antiquity'],
  },
  {
    id: 'f6',
    title: 'The Geopolitics of Silicon: How TSMC Holds the World\'s Strategic Balance',
    summary:
      'A deep analysis of Chris Miller\'s Chip War — why a single fabrication facility in Taiwan produces 92% of the world\'s advanced semiconductors, and what unfolds if that line of production is contested. Economic, security, and technological implications converge.',
    source: 'Foreign Affairs',
    sourceAvatar: '◎',
    category: 'Geopolitics',
    categoryColor: TAG_COLORS.geopolitics,
    readTime: 12,
    podcastDuration: 900,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    contentSource: 'trending',
    contentType: 'article',
    likes: 3891,
    saves: 1432,
    isLiked: true,
    isSaved: false,
    timestamp: '2 days ago',
    tags: ['Geopolitics', 'Semiconductors', 'Macro', 'Strategy'],
    trendingScore: 87,
  },
];

// ─── PLAN DATA ───────────────────────────────────────────────────────────────

export const PLAN_ITEMS: PlanItem[] = [
  {
    id: 'p1',
    title: 'Zone 2 Endurance Protocol — Eight-Week Build',
    sourceItem: 'Zone 2 Training: The Cellular Science of Endurance',
    category: 'Performance',
    categoryColor: TAG_COLORS.fitness,
    type: 'fitness',
    progress: 35,
    createdAt: 'Created 3 days ago',
    dueDate: '5 weeks remaining',
    steps: [
      {
        id: 's1',
        title: 'Acquire Garmin HRM-Pro chest strap',
        description: 'Precision heart-rate measurement is essential to remain within the 60–70% threshold.',
        isCompleted: true,
        type: 'buy',
        link: 'https://amazon.com',
      },
      {
        id: 's2',
        title: 'Calculate individual maximum heart rate',
        description: 'Apply the formula: 220 minus age. Then derive 60–70% to define your Zone 2 corridor.',
        isCompleted: true,
        type: 'task',
      },
      {
        id: 's3',
        title: 'Inaugural Zone 2 session — thirty minutes',
        description: 'Light run, cycling, or brisk walking — maintaining conversational pace throughout.',
        isCompleted: false,
        type: 'practice',
      },
      {
        id: 's4',
        title: 'Read the mitochondrial chapter in Outlive',
        description: 'Peter Attia — Chapter 12, on the biology of human performance.',
        isCompleted: false,
        type: 'read',
      },
      {
        id: 's5',
        title: 'Schedule four weekly sessions in your calendar',
        description: 'Tuesday, Thursday, Saturday, Sunday — forty-five minutes each.',
        isCompleted: false,
        type: 'task',
      },
    ],
  },
  {
    id: 'p2',
    title: 'AI in Medicine — Structured Study Path',
    sourceItem: 'The AI Predicting Cardiac Events Seven Years in Advance',
    category: 'AI',
    categoryColor: TAG_COLORS.ai,
    type: 'learning',
    progress: 60,
    createdAt: 'Created last week',
    dueDate: '3 weeks remaining',
    steps: [
      {
        id: 's1',
        title: 'Read the full paper in Nature Medicine',
        description: 'Download the PDF and annotate core concepts and methodology.',
        isCompleted: true,
        type: 'read',
        link: 'https://nature.com',
      },
      {
        id: 's2',
        title: 'Attend the DeepMind webinar on Medical AI',
        description: 'Ninety-minute session with the lead research team.',
        isCompleted: true,
        type: 'watch',
        link: 'https://youtube.com',
      },
      {
        id: 's3',
        title: 'Course: Machine Learning for Healthcare (MIT)',
        description: 'MIT OpenCourseWare — eight lectures, complimentary access.',
        isCompleted: false,
        type: 'read',
        link: 'https://ocw.mit.edu',
      },
      {
        id: 's4',
        title: 'Join the AI & Medicine club for discourse',
        description: 'Exchange perspectives with practitioners in the field.',
        isCompleted: false,
        type: 'task',
      },
    ],
  },
];

// ─── CLUBS DATA ──────────────────────────────────────────────────────────────

export const CLUBS: Club[] = [
  {
    id: 'c1',
    name: 'The Biography Society',
    description: 'A quarterly study of the lives that shaped history. One curated volume per month, weekly Socratic discussion.',
    category: 'Literature',
    categoryColor: TAG_COLORS.business,
    members: 1847,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
    isJoined: false,
    level: 'beginner',
    requiredScore: 0,
    currentChallenge: 'Read Walter Isaacson\'s biography of Benjamin Franklin before month\'s end.',
    weeklyActivity: 87,
    tags: ['Biography', 'History', 'Literature'],
  },
  {
    id: 'c2',
    name: 'Longevity Protocol',
    description: 'Translating contemporary longevity research into lived practice — sleep, nutrition, training, and mental architecture.',
    category: 'Health',
    categoryColor: TAG_COLORS.health,
    members: 3201,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    isJoined: false,
    level: 'intermediate',
    requiredScore: 0,
    currentChallenge: 'Thirty-day Zone 2 challenge — four sessions per week.',
    weeklyActivity: 92,
    tags: ['Longevity', 'Training', 'Nutrition', 'Sleep'],
  },
  {
    id: 'c3',
    name: 'The Geopolitics Roundtable',
    description: 'Weekly analysis of pivotal geopolitical developments — drawing exclusively from primary sources.',
    category: 'Geopolitics',
    categoryColor: TAG_COLORS.geopolitics,
    members: 2543,
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&q=80',
    isJoined: false,
    level: 'intermediate',
    requiredScore: 0,
    currentChallenge: 'Brief: The strategic implications of the 2026 US-China trade realignment.',
    weeklyActivity: 78,
    tags: ['Geopolitics', 'Strategy', 'Macro'],
  },
  {
    id: 'c4',
    name: 'AI Builders Circle',
    description: 'Practitioners deploying AI in production. Code, tooling, evaluations, and lessons shared in a high-signal environment.',
    category: 'AI',
    categoryColor: TAG_COLORS.ai,
    members: 4892,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
    isJoined: false,
    level: 'intermediate',
    requiredScore: 0,
    currentChallenge: 'Build an autonomous agent that summarizes academic papers end-to-end.',
    weeklyActivity: 95,
    tags: ['AI', 'Engineering', 'LLM', 'Automation'],
  },
  {
    id: 'c5',
    name: 'Stoic Daily Practice',
    description: 'A daily discipline of Stoic principle — journaling, contemplative meditation, and the practice of Memento Mori.',
    category: 'Philosophy',
    categoryColor: TAG_COLORS.philosophy,
    members: 1203,
    image: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=400&q=80',
    isJoined: false,
    level: 'beginner',
    requiredScore: 0,
    currentChallenge: 'Keep a Stoic journal for twenty-one consecutive days.',
    weeklyActivity: 71,
    tags: ['Philosophy', 'Mindfulness', 'Discipline'],
  },
];

// ─── USER PROFILE ────────────────────────────────────────────────────────────

export const USER_PROFILE: UserProfile = {
  id: 'u1',
  name: 'Itai Bell',
  email: 'itaibell134@gmail.com',
  birthDate: '1995-03-15',
  avatar: 'I',
  joinedDate: 'January 2024',
  totalScore: 2847,
  weeklyStreak: 14,
  articlesRead: 312,
  podcastsListened: 87,
  booksCompleted: 24,
  plansCompleted: 9,
  following: 43,
  followers: 128,
  knowledgeTree: [
    {
      id: 'k1',
      label: 'Health & Longevity',
      score: 82,
      color: TAG_COLORS.health,
      children: [
        { id: 'k1a', label: 'Longevity', score: 78, color: TAG_COLORS.health },
        { id: 'k1b', label: 'Performance', score: 88, color: TAG_COLORS.fitness },
        { id: 'k1c', label: 'Nutrition', score: 71, color: TAG_COLORS.philosophy },
        { id: 'k1d', label: 'Sleep Science', score: 65, color: TAG_COLORS.science },
      ],
    },
    {
      id: 'k2',
      label: 'Technology & Strategy',
      score: 76,
      color: TAG_COLORS.ai,
      children: [
        { id: 'k2a', label: 'Artificial Intelligence', score: 84, color: TAG_COLORS.ai },
        { id: 'k2b', label: 'Entrepreneurship', score: 70, color: TAG_COLORS.business },
        { id: 'k2c', label: 'Geopolitics', score: 62, color: TAG_COLORS.geopolitics },
      ],
    },
    {
      id: 'k3',
      label: 'The Humanities',
      score: 68,
      color: TAG_COLORS.philosophy,
      children: [
        { id: 'k3a', label: 'Philosophy', score: 73, color: TAG_COLORS.philosophy },
        { id: 'k3b', label: 'Psychology', score: 79, color: TAG_COLORS.psychology },
        { id: 'k3c', label: 'History', score: 58, color: TAG_COLORS.psychology },
      ],
    },
    {
      id: 'k4',
      label: 'Sciences',
      score: 71,
      color: TAG_COLORS.science,
      children: [
        { id: 'k4a', label: 'Biology', score: 69, color: TAG_COLORS.science },
        { id: 'k4b', label: 'Neuroscience', score: 74, color: TAG_COLORS.ai },
        { id: 'k4c', label: 'Physics', score: 52, color: TAG_COLORS.business },
      ],
    },
  ],
  badges: [
    {
      id: 'b1',
      name: 'Devoted Reader',
      icon: '◆',
      description: '100 articles consumed with depth',
      unlockedAt: 'March 2024',
    },
    {
      id: 'b2',
      name: 'Deep Thinker',
      icon: '◇',
      description: 'Five structured learning plans completed',
      unlockedAt: 'May 2024',
    },
    {
      id: 'b3',
      name: 'Longevity Pioneer',
      icon: '◉',
      description: 'Zone 2 challenge completed in full',
      unlockedAt: 'June 2024',
    },
    {
      id: 'b4',
      name: 'The Connector',
      icon: '◈',
      description: 'Active in three curated clubs',
      unlockedAt: 'July 2024',
    },
  ],
};
