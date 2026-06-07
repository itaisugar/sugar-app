import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchProfile, updateProfile as updateProfileApi, Profile, ProfilePatch } from './profile';

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  // The id of the user whose profile we've finished resolving. Tracking this
  // lets `loading` mean "haven't resolved THIS user's profile yet" — which is
  // already true on the render where `user` first appears, before the fetch
  // effect runs. Without it there's a tick where loading=false but profile=null,
  // which would let routing send a freshly-authed user to the wrong screen.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (userId: string) => {
    setError(null);
    try {
      const data = await fetchProfile(userId);
      setProfile(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoadedUserId(userId);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoadedUserId(null);
      return;
    }
    load(user.id);
  }, [user, load]);

  const loading = !!user && loadedUserId !== user.id;

  const refresh = useCallback(async () => {
    if (user) await load(user.id);
  }, [user, load]);

  const updateProfile: ProfileContextValue['updateProfile'] = useCallback(
    async (patch) => {
      if (!user) throw new Error('Not authenticated');
      const updated = await updateProfileApi(user.id, patch);
      setProfile(updated);
    },
    [user],
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refresh, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
