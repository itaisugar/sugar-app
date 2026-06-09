import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import BrandSplash from '../components/BrandSplash';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  useFonts as useSpaceMono,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { Colors } from '../constants/Theme';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { ProfileProvider, useProfile } from '../lib/ProfileContext';
import { PodcastPlayerProvider } from '../lib/PodcastPlayerContext';
import { LanguageProvider } from '../lib/LanguageContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    const inOnboardingGroup = group === '(onboarding)';

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (profileLoading) return;

    // A logged-in user who hasn't completed onboarding — including the brief
    // window right after signup where the profile row exists but hasn't been
    // fetched yet (profile === null) — must land on onboarding, not the feed.
    if (!profile || !profile.onboarded) {
      if (!inOnboardingGroup) router.replace('/(onboarding)/welcome');
      return;
    }

    if (inAuthGroup || inOnboardingGroup) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading, profile, profileLoading, segments]);

  if (authLoading || (session && profileLoading && !profile)) {
    return <BrandSplash />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [groteskLoaded] = useSpaceGrotesk({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [monoLoaded] = useSpaceMono({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!interLoaded || !groteskLoaded || !monoLoaded) {
    return <BrandSplash />;
  }

  return (
    <AuthProvider>
      <ProfileProvider>
       <LanguageProvider>
        <PodcastPlayerProvider>
          <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="light" />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              </Stack>
            </AuthGate>
          </View>
        </PodcastPlayerProvider>
       </LanguageProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
