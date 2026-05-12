const ONBOARDING_COMPLETED_VALUE = 'done';

export function isOnboardingCompleted(storageKey: string) {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(storageKey) === ONBOARDING_COMPLETED_VALUE;
}

export function markOnboardingCompleted(storageKey: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(storageKey, ONBOARDING_COMPLETED_VALUE);
}
