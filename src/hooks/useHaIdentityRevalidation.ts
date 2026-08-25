import { useEffect, useState } from 'react';
import {
  parseHaCurrentUser,
  type HaAuthUser,
} from '../services/haIdentityPresentation';

export const HA_IDENTITY_REVALIDATION_INTERVAL_MS = 15_000;

type HaApiCall = (
  message: Record<string, unknown>,
  options?: { reportError?: boolean },
) => Promise<unknown | null>;

type HaIdentityRevalidationOptions = {
  isConnected: boolean;
  callApi: HaApiCall;
};

function isSameUser(left: HaAuthUser | null, right: HaAuthUser | null) {
  return (
    left?.id === right?.id &&
    left?.name === right?.name &&
    left?.username === right?.username &&
    left?.email === right?.email &&
    left?.isOwner === right?.isOwner &&
    left?.isAdmin === right?.isAdmin
  );
}

/**
 * Home Assistant can change a user's role without closing the existing
 * WebSocket. Re-read the server-owned identity while connected so structural
 * dashboard permissions never remain cached for the whole browser session.
 */
export function useHaIdentityRevalidation({
  isConnected,
  callApi,
}: HaIdentityRevalidationOptions) {
  const [currentUser, setCurrentUser] = useState<HaAuthUser | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setCurrentUser(null);
      return undefined;
    }

    let cancelled = false;
    let inFlight = false;

    const refreshIdentity = async () => {
      if (cancelled || inFlight) {
        return;
      }
      inFlight = true;
      let nextUser: HaAuthUser | null = null;
      try {
        const payload = await callApi(
          { type: 'auth/current_user' },
          { reportError: false },
        );
        nextUser = parseHaCurrentUser(payload);
      } catch {
        nextUser = null;
      } finally {
        inFlight = false;
      }
      if (cancelled) {
        return;
      }
      setCurrentUser((previous) => (isSameUser(previous, nextUser) ? previous : nextUser));
    };

    void refreshIdentity();

    if (typeof window === 'undefined') {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(
      () => void refreshIdentity(),
      HA_IDENTITY_REVALIDATION_INTERVAL_MS,
    );
    const handleWindowFocus = () => void refreshIdentity();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshIdentity();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callApi, isConnected]);

  return currentUser;
}

export default useHaIdentityRevalidation;
