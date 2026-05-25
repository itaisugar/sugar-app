export type ContentType = 'research' | 'book' | 'podcast';
export type PlanCategory = 'learning' | 'health' | 'habit';
export type Topic =
  | 'All'
  | 'AI'
  | 'Psychology'
  | 'Longevity'
  | 'History'
  | 'Philosophy'
  | 'Neuroscience'
  | 'Productivity'
  | 'Finance';
export type ClubCategory = 'reading' | 'fitness' | 'research' | 'learning';

export interface FeedItem {
  id: string;
  type: ContentType;
  title: string;
  author: string;
  source: string;
  summary: string;
  readTime: number;
  topic: Exclude<Topic, 'All'>;
  friendsRead: string[];
  isBookmarked: boolean;
  isLiked: boolean;
  likeCount: number;
  addedToPlan: boolean;
}

export interface ActionStep {
  id: string;
  label: string;
  detail?: string;
  type: 'read' | 'buy' | 'calendar' | 'reminder' | 'exercise' | 'practice';
  url?: string;
  isCompleted: boolean;
}

export interface PlanItem {
  id: string;
  feedItemId: string;
  title: string;
  source: string;
  type: ContentType;
  category: PlanCategory;
  steps: ActionStep[];
  addedAt: string;
}

export interface Club {
  id: string;
  emoji: string;
  name: string;
  description: string;
  memberCount: number;
  category: ClubCategory;
  currentChallenge: string;
  matchPercent: number;
  isJoined: boolean;
  isPending: boolean;
  tags: string[];
}

export interface Achievement {
  id: string;
  emoji: string;
  label: string;
}

export interface Friend {
  id: string;
  name: string;
  initials: string;
  streak: number;
  color: string;
}

export interface ActivityEntry {
  id: string;
  icon: string;
  description: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  initials: string;
  stats: {
    streakDays: number;
    booksRead: number;
    papersRead: number;
    clubRank: string;
  };
  interests: Exclude<Topic, 'All'>[];
  achievements: Achievement[];
  friends: Friend[];
  recentActivity: ActivityEntry[];
}
