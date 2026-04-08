import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginWithEmail, loginWithGoogleDev, registerWithEmail } from '@/services/auth';
import type { DeviceLocation } from '@/services/location';
import { getCurrentDeviceLocation } from '@/services/location';
import { listNearbyUsers } from '@/services/nearby';
import { getMyProfile, updateMyProfile, type ProfileDraft } from '@/services/profile';
import { getErrorMessage } from '@/services/http';
import { getVisibilityStatus, leaveVenueSession, startVisibilitySession, stopVisibilitySession, updateVisibilityLocation } from '@/services/visibility';
import { sessionStorage } from '@/state/session-storage';
import type { Profile, User, Venue, VisibilitySession } from '@/types/domain';

const LOCATION_REFRESH_MS = 60_000;

type SessionState = {
  isBootstrapped: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  isVisible: boolean;
  nearbyCount: number;
  activeVenue: Venue | null;
  visibilitySession: VisibilitySession | null;
  user: User | null;
  profile: Profile | null;
  markOnboardingSeen: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogleDev: () => Promise<void>;
  signOut: () => Promise<void>;
  setVisible: (value: boolean, location?: DeviceLocation) => Promise<void>;
  refreshVisibilityLocation: (location: DeviceLocation) => Promise<void>;
  leaveVenue: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  saveProfile: (draft: ProfileDraft) => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [visibilitySession, setVisibilitySession] = useState<VisibilitySession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [token, onboardingSeen, visibility, snapshot] = await Promise.all([
        sessionStorage.getToken(),
        sessionStorage.getOnboardingSeen(),
        sessionStorage.getVisibility(),
        sessionStorage.getSnapshot()
      ]);

      if (!mounted) {
        return;
      }

      setIsAuthenticated(Boolean(token));
      setHasSeenOnboarding(onboardingSeen);
      setIsVisible(visibility);
      setUser(snapshot?.user ?? null);
      setProfile(snapshot?.profile ?? null);

      if (token) {
        try {
          const [freshProfile, visibilityStatus, nearby] = await Promise.all([
            getMyProfile(),
            getVisibilityStatus(),
            listNearbyUsers()
          ]);

          if (!mounted) {
            return;
          }

          setProfile(freshProfile);
          setIsVisible(visibilityStatus.isVisible);
          setVisibilitySession(visibilityStatus.session);
          setActiveVenue(visibilityStatus.session?.venue ?? null);
          setNearbyCount(nearby.summary.count);
          await sessionStorage.setVisibility(visibilityStatus.isVisible);
          await sessionStorage.setSnapshot({
            user: snapshot?.user ?? null,
            profile: freshProfile
          });
        } catch {
          await sessionStorage.clearToken();
          await sessionStorage.clearSnapshot();
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
          setVisibilitySession(null);
          setActiveVenue(null);
        }
      }

      setIsBootstrapped(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isVisible) {
      return;
    }

    let isRunning = false;

    const refreshLocation = async () => {
      if (isRunning) {
        return;
      }

      isRunning = true;

      try {
        const location = await getCurrentDeviceLocation();
        const result = await updateVisibilityLocation(location);
        setVisibilitySession(result.session);
        setActiveVenue(result.session?.venue ?? null);
      } catch {
        // Foreground refresh failures should not break the session.
      } finally {
        isRunning = false;
      }
    };

    const maybeRefresh = () => {
      if (AppState.currentState === 'active') {
        void refreshLocation();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        maybeRefresh();
      }
    });

    const interval = setInterval(maybeRefresh, LOCATION_REFRESH_MS);

    return () => {
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, [isAuthenticated, isVisible]);

  const value = useMemo<SessionState>(
    () => ({
      isBootstrapped,
      isAuthenticated,
      hasSeenOnboarding,
      isVisible,
      nearbyCount,
      activeVenue,
      visibilitySession,
      user,
      profile,
      markOnboardingSeen: async () => {
        await sessionStorage.setOnboardingSeen();
        setHasSeenOnboarding(true);
      },
      signIn: async (email: string, password: string) => {
        const result = await loginWithEmail(email, password);
        await sessionStorage.setToken(result.accessToken);
        await sessionStorage.setSnapshot({
          user: result.user,
          profile: result.profile
        });
        setIsAuthenticated(true);
        setUser(result.user);
        setProfile(result.profile);
        const visibility = await getVisibilityStatus();
        const nearby = await listNearbyUsers();
        setIsVisible(visibility.isVisible);
        setVisibilitySession(visibility.session);
        setActiveVenue(visibility.session?.venue ?? null);
        setNearbyCount(nearby.summary.count);
        await sessionStorage.setVisibility(visibility.isVisible);
      },
      signUp: async (name: string, email: string, password: string) => {
        const result = await registerWithEmail(name, email, password);
        await sessionStorage.setToken(result.accessToken);
        await sessionStorage.setSnapshot({
          user: result.user,
          profile: result.profile
        });
        setIsAuthenticated(true);
        setUser(result.user);
        setProfile(result.profile);
        setIsVisible(false);
        setVisibilitySession(null);
        setActiveVenue(null);
        const nearby = await listNearbyUsers();
        setNearbyCount(nearby.summary.count);
      },
      signInWithGoogleDev: async () => {
        const result = await loginWithGoogleDev('Google Dev User', 'google.dev@nearme.app');
        await sessionStorage.setToken(result.accessToken);
        await sessionStorage.setSnapshot({
          user: result.user,
          profile: result.profile
        });
        setIsAuthenticated(true);
        setUser(result.user);
        setProfile(result.profile);
        const visibility = await getVisibilityStatus();
        const nearby = await listNearbyUsers();
        setIsVisible(visibility.isVisible);
        setVisibilitySession(visibility.session);
        setActiveVenue(visibility.session?.venue ?? null);
        setNearbyCount(nearby.summary.count);
      },
      signOut: async () => {
        await sessionStorage.clearToken();
        await sessionStorage.clearSnapshot();
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
        setIsVisible(false);
        setVisibilitySession(null);
        setActiveVenue(null);
        setNearbyCount(0);
      },
      setVisible: async (value: boolean, location?: DeviceLocation) => {
        const result = value ? await startVisibilitySession(location) : await stopVisibilitySession();
        await sessionStorage.setVisibility(result.isVisible);
        setIsVisible(result.isVisible);
        setVisibilitySession(result.session);
        setActiveVenue(result.session?.venue ?? null);
        const nearby = await listNearbyUsers();
        setNearbyCount(nearby.summary.count);
      },
      refreshVisibilityLocation: async (location: DeviceLocation) => {
        const result = await updateVisibilityLocation(location);
        await sessionStorage.setVisibility(result.isVisible);
        setIsVisible(result.isVisible);
        setVisibilitySession(result.session);
        setActiveVenue(result.session?.venue ?? null);
        const nearby = await listNearbyUsers();
        setNearbyCount(nearby.summary.count);
      },
      leaveVenue: async () => {
        const result = await leaveVenueSession();
        setVisibilitySession(result.session);
        setActiveVenue(result.session?.venue ?? null);
      },
      refreshDashboard: async () => {
        try {
          const [freshProfile, visibility, nearby] = await Promise.all([
            getMyProfile(),
            getVisibilityStatus(),
            listNearbyUsers()
          ]);
          setProfile(freshProfile);
          setIsVisible(visibility.isVisible);
          setVisibilitySession(visibility.session);
          setActiveVenue(visibility.session?.venue ?? null);
          setNearbyCount(nearby.summary.count);
          await sessionStorage.setVisibility(visibility.isVisible);
          await sessionStorage.setSnapshot({
            user,
            profile: freshProfile
          });
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
      saveProfile: async (draft: ProfileDraft) => {
        const nextProfile = await updateMyProfile(draft);
        setProfile(nextProfile);
        await sessionStorage.setSnapshot({
          user,
          profile: nextProfile
        });
      }
    }),
    [activeVenue, hasSeenOnboarding, isAuthenticated, isBootstrapped, isVisible, nearbyCount, profile, user, visibilitySession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
