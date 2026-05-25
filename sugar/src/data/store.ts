import { FeedItem, PlanItem, Club, UserProfile } from '@/types';
import {
  initialFeedItems,
  initialPlanItems,
  initialClubs,
  userProfile as initialProfile,
} from './mock';

// Deep clone to allow mutations
let feedItems: FeedItem[] = JSON.parse(JSON.stringify(initialFeedItems));
let planItems: PlanItem[] = JSON.parse(JSON.stringify(initialPlanItems));
let clubs: Club[] = JSON.parse(JSON.stringify(initialClubs));

export const store = {
  // Getters
  getFeedItems: (): FeedItem[] => feedItems,
  getPlanItems: (): PlanItem[] => planItems,
  getClubs: (): Club[] => clubs,
  getProfile: (): UserProfile => initialProfile,

  // Feed mutations
  toggleLike: (id: string) => {
    feedItems = feedItems.map((item) =>
      item.id === id
        ? {
            ...item,
            isLiked: !item.isLiked,
            likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1,
          }
        : item
    );
  },

  toggleBookmark: (id: string) => {
    feedItems = feedItems.map((item) =>
      item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
    );
  },

  addToPlan: (feedItemId: string) => {
    const feedItem = feedItems.find((f) => f.id === feedItemId);
    if (!feedItem || feedItem.addedToPlan) return;

    feedItems = feedItems.map((item) =>
      item.id === feedItemId ? { ...item, addedToPlan: true } : item
    );

    const newPlanItem: PlanItem = {
      id: `p-${feedItemId}-${Date.now()}`,
      feedItemId,
      title: feedItem.title,
      source: feedItem.source,
      type: feedItem.type,
      category: feedItem.topic === 'Longevity' || feedItem.topic === 'Neuroscience' ? 'health' :
                feedItem.topic === 'AI' || feedItem.topic === 'History' || feedItem.topic === 'Philosophy' ? 'learning' :
                'habit',
      addedAt: new Date().toISOString(),
      steps: [
        { id: `step-${feedItemId}-1`, label: `Read the full ${feedItem.type}`, type: 'read', isCompleted: false },
        { id: `step-${feedItemId}-2`, label: 'Take notes on key insights', type: 'practice', isCompleted: false },
        { id: `step-${feedItemId}-3`, label: 'Apply one insight this week', type: 'practice', isCompleted: false },
        { id: `step-${feedItemId}-4`, label: 'Share with a friend or club', type: 'practice', isCompleted: false },
      ],
    };

    planItems = [newPlanItem, ...planItems];
  },

  // Plan mutations
  toggleStep: (planId: string, stepId: string) => {
    planItems = planItems.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            steps: plan.steps.map((step) =>
              step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
            ),
          }
        : plan
    );
  },

  removePlanItem: (planId: string) => {
    const plan = planItems.find((p) => p.id === planId);
    if (plan) {
      feedItems = feedItems.map((item) =>
        item.id === plan.feedItemId ? { ...item, addedToPlan: false } : item
      );
    }
    planItems = planItems.filter((p) => p.id !== planId);
  },

  // Club mutations
  toggleJoinClub: (clubId: string) => {
    clubs = clubs.map((club) => {
      if (club.id !== clubId) return club;
      if (club.isJoined) {
        return { ...club, isJoined: false, isPending: false, memberCount: club.memberCount - 1 };
      }
      if (club.isPending) {
        return { ...club, isPending: false };
      }
      return { ...club, isJoined: true, memberCount: club.memberCount + 1 };
    });
  },
};
