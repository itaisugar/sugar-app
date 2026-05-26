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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfile(userId);
      setProfile(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    load(user.id);
  }, [user, load]);

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
