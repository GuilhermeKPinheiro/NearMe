import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loginWithEmail, loginWithGoogleIdToken, registerWithEmail } from '@/services/auth';
import { debugLog, measureAsync } from '@/services/diagnostics';
import { getErrorMessage } from '@/services/http';
import type { DeviceLocation } from '@/services/location';
import { getCurrentDeviceLocation } from '@/services/location';
import { listNearbyUsers } from '@/services/nearby';
import { ensurePushDeviceRegistered, unregisterCurrentPushDevice } from '@/services/push';
import { getMyProfile, updateMyProfile, type ProfileDraft } from '@/services/profile';
import { realtimeClient } from '@/services/realtime';
import { sessionStorage } from '@/state/session-storage';
import type { Profile, User, Venue, VisibilitySession } from '@/types/domain';
import {
  getVisibilityStatus,
  leaveVenueSession,
  startVisibilitySession,
  stopVisibilitySession,
  updateVisibilityLocation,
} from '@/services/visibility';

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
  signUp: (name: string, email: string, password: string) => Promise<{ message: string; email: string }>;
  signInWithGoogle: (idToken: string) => Promise<void>;
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
  const userRef = useRef<User | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [token, onboardingSeen, visibility, snapshot] = await Promise.all([
        sessionStorage.getToken(),
        sessionStorage.getOnboardingSeen(),
        sessionStorage.getVisibility(),
        sessionStorage.getSnapshot(),
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
            measureAsync('session', 'bootstrapProfile', () => getMyProfile()),
            measureAsync('session', 'bootstrapVisibility', () => getVisibilityStatus()),
            measureAsync('session', 'bootstrapNearby', () => listNearbyUsers()),
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
            profile: freshProfile,
          });
        } catch (error) {
          debugLog(
            'session',
            'bootstrapFailed',
            { error: error instanceof Error ? error.message : String(error) },
            'error'
          );
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
    if (!isAuthenticated) {
      realtimeClient.disconnect();
      return;
    }

    void sessionStorage.getToken().then(async (token) => {
      if (token) {
        realtimeClient.connect(token);
        await ensurePushDeviceRegistered();
      }
    });

    return () => {
      realtimeClient.disconnect();
    };
  }, [isAuthenticated]);

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
        const location = await measureAsync('session', 'backgroundLocationLookup', () => getCurrentDeviceLocation());
        const result = await measureAsync('session', 'backgroundVisibilityRefresh', () => updateVisibilityLocation(location));
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

  const markOnboardingSeen = useCallback(async () => {
    await measureAsync('session', 'markOnboardingSeen', () => sessionStorage.setOnboardingSeen());
    setHasSeenOnboarding(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await measureAsync('session', 'signIn', () => loginWithEmail(email, password), {
      email,
    });

    await measureAsync('session', 'persistSignIn', async () => {
      await sessionStorage.setToken(result.accessToken);
      await sessionStorage.setSnapshot({
        user: result.user,
        profile: result.profile,
      });
    });

    setIsAuthenticated(true);
    setUser(result.user);
    setProfile(result.profile);

    const [visibility, nearby] = await Promise.all([
      measureAsync('session', 'signInVisibilityStatus', () => getVisibilityStatus()),
      measureAsync('session', 'signInNearbyUsers', () => listNearbyUsers()),
    ]);

    setIsVisible(visibility.isVisible);
    setVisibilitySession(visibility.session);
    setActiveVenue(visibility.session?.venue ?? null);
    setNearbyCount(nearby.summary.count);
    await sessionStorage.setVisibility(visibility.isVisible);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await measureAsync('session', 'signUp', () => registerWithEmail(name, email, password), {
      email,
      nameLength: name.length,
    });

    return {
      message: result.message,
      email: result.email,
    };
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const result = await measureAsync('session', 'signInWithGoogle', () => loginWithGoogleIdToken(idToken));

    await measureAsync('session', 'persistGoogleSignIn', async () => {
      await sessionStorage.setToken(result.accessToken);
      await sessionStorage.setSnapshot({
        user: result.user,
        profile: result.profile,
      });
    });

    setIsAuthenticated(true);
    setUser(result.user);
    setProfile(result.profile);

    const [visibility, nearby] = await Promise.all([
      measureAsync('session', 'googleVisibilityStatus', () => getVisibilityStatus()),
      measureAsync('session', 'googleNearbyUsers', () => listNearbyUsers()),
    ]);

    setIsVisible(visibility.isVisible);
    setVisibilitySession(visibility.session);
    setActiveVenue(visibility.session?.venue ?? null);
    setNearbyCount(nearby.summary.count);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unregisterCurrentPushDevice();
    } catch {
      // Push cleanup is best-effort during sign out.
    }

    await measureAsync('session', 'signOut', async () => {
      await sessionStorage.clearToken();
      await sessionStorage.clearSnapshot();
    });

    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
    setIsVisible(false);
    setVisibilitySession(null);
    setActiveVenue(null);
    setNearbyCount(0);
  }, []);

  const setVisible = useCallback(async (value: boolean, location?: DeviceLocation) => {
    const result = await measureAsync(
      'session',
      value ? 'startVisibilitySession' : 'stopVisibilitySession',
      () => (value ? startVisibilitySession(location) : stopVisibilitySession()),
      { hasLocation: Boolean(location) }
    );

    await sessionStorage.setVisibility(result.isVisible);
    setIsVisible(result.isVisible);
    setVisibilitySession(result.session);
    setActiveVenue(result.session?.venue ?? null);

    if (!result.isVisible) {
      setNearbyCount(0);
      return;
    }

    const nearby = await measureAsync('session', 'refreshNearbyAfterVisibility', () => listNearbyUsers());
    setNearbyCount(nearby.summary.count);
  }, []);

  const refreshVisibilityLocation = useCallback(async (location: DeviceLocation) => {
    const result = await measureAsync('session', 'refreshVisibilityLocation', () => updateVisibilityLocation(location), {
      accuracyMeters: location.accuracyMeters,
    });

    await sessionStorage.setVisibility(result.isVisible);
    setIsVisible(result.isVisible);
    setVisibilitySession(result.session);
    setActiveVenue(result.session?.venue ?? null);

    const nearby = await measureAsync('session', 'refreshNearbyAfterLocation', () => listNearbyUsers());
    setNearbyCount(nearby.summary.count);
  }, []);

  const leaveVenue = useCallback(async () => {
    const result = await measureAsync('session', 'leaveVenue', () => leaveVenueSession());
    setVisibilitySession(result.session);
    setActiveVenue(result.session?.venue ?? null);
  }, []);

  const refreshDashboard = useCallback(async () => {
    debugLog('session', 'refreshDashboard:start', {
      hasUser: Boolean(userRef.current),
      hasProfile: Boolean(profileRef.current),
      isVisible: isVisibleRef.current,
    });

    const [profileResult, visibilityResult, nearbyResult] = await Promise.allSettled([
      measureAsync('session', 'dashboardProfile', () => getMyProfile()),
      measureAsync('session', 'dashboardVisibility', () => getVisibilityStatus()),
      measureAsync('session', 'dashboardNearby', () => listNearbyUsers()),
    ]);

    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value);
      await sessionStorage.setSnapshot({
        user: userRef.current,
        profile: profileResult.value,
      });
    }

    if (visibilityResult.status === 'fulfilled') {
      setIsVisible(visibilityResult.value.isVisible);
      setVisibilitySession(visibilityResult.value.session);
      setActiveVenue(visibilityResult.value.session?.venue ?? null);
      await sessionStorage.setVisibility(visibilityResult.value.isVisible);

      if (!visibilityResult.value.isVisible) {
        setNearbyCount(0);
      }
    }

    if (nearbyResult.status === 'fulfilled' && visibilityResult.status === 'fulfilled' && visibilityResult.value.isVisible) {
      setNearbyCount(nearbyResult.value.summary.count);
    }

    debugLog('session', 'refreshDashboard:done', {
      profile: profileResult.status,
      visibility: visibilityResult.status,
      nearby: nearbyResult.status,
    });

    if (
      profileResult.status === 'rejected' &&
      visibilityResult.status === 'rejected' &&
      nearbyResult.status === 'rejected'
    ) {
      throw new Error(getErrorMessage(profileResult.reason));
    }
  }, []);

  const saveProfile = useCallback(
    async (draft: ProfileDraft) => {
      const nextProfile = await measureAsync('session', 'saveProfile', () => updateMyProfile(draft), {
        hasPhoto: Boolean(draft.photoUrl),
        publicPhotos: draft.publicPhotoUrls ? draft.publicPhotoUrls.split('\n').filter(Boolean).length : 0,
        publicStories: draft.storyPhotoUrls ? draft.storyPhotoUrls.split('\n').filter(Boolean).length : 0,
        matchStories: draft.matchOnlyStoryPhotoUrls ? draft.matchOnlyStoryPhotoUrls.split('\n').filter(Boolean).length : 0,
      });

      setProfile(nextProfile);
      await sessionStorage.setSnapshot({
        user: userRef.current,
        profile: nextProfile,
      });
    },
    []
  );

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
      markOnboardingSeen,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      setVisible,
      refreshVisibilityLocation,
      leaveVenue,
      refreshDashboard,
      saveProfile,
    }),
    [
      activeVenue,
      hasSeenOnboarding,
      isAuthenticated,
      isBootstrapped,
      isVisible,
      leaveVenue,
      markOnboardingSeen,
      nearbyCount,
      profile,
      refreshDashboard,
      refreshVisibilityLocation,
      saveProfile,
      setVisible,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      user,
      visibilitySession,
    ]
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
