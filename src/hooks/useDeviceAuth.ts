import { useCallback, useEffect, useMemo, useState } from 'react';

export type AuthUserContext = {
  id: string;
  name: string;
  displayName: string;
};

const DEVICE_AUTH_CREDENTIAL_STORAGE_PREFIX = 'ha.dashboard.deviceAuth.credentialId.';
const LEGACY_DEVICE_AUTH_CREDENTIAL_STORAGE_KEY = 'ha.dashboard.security.biometricCredentialId';
const DEVICE_AUTH_RP_NAME = 'Home Assistant Dashboard';

function hasWebAuthnSupport() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.credentials) &&
    Boolean(window.crypto)
  );
}

function bytesToBase64Url(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToArrayBuffer(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function createChallenge(length = 32) {
  const challenge = new Uint8Array(length);
  window.crypto.getRandomValues(challenge);
  return challenge;
}

function readStoredCredentialId(storageKey: string) {
  if (typeof window === 'undefined') {
    return '';
  }
  return (
    window.localStorage.getItem(storageKey)?.trim() ??
    window.localStorage.getItem(LEGACY_DEVICE_AUTH_CREDENTIAL_STORAGE_KEY)?.trim() ??
    ''
  );
}

export function useDeviceAuth(currentUser?: Partial<AuthUserContext>) {
  const userKey = useMemo(() => {
    const fallbackId = 'current_user';
    const id = currentUser?.id?.trim() || fallbackId;
    if (typeof window === 'undefined') {
      return encodeURIComponent(id);
    }
    return bytesToBase64Url(new TextEncoder().encode(id));
  }, [currentUser?.id]);

  const credentialStorageKey = useMemo(
    () => `${DEVICE_AUTH_CREDENTIAL_STORAGE_PREFIX}${userKey}`,
    [userKey],
  );
  const [credentialId, setCredentialId] = useState(() => readStoredCredentialId(credentialStorageKey));

  const userMetadata = useMemo(() => {
    const fallbackId = 'current_user';
    const id = currentUser?.id?.trim() || fallbackId;
    const name = currentUser?.name?.trim() || id;
    const displayName = currentUser?.displayName?.trim() || currentUser?.name?.trim() || 'Utente Corrente';

    return {
      id: new TextEncoder().encode(id),
      name,
      displayName,
    };
  }, [currentUser?.displayName, currentUser?.id, currentUser?.name]);

  useEffect(() => {
    const storedCredentialId = readStoredCredentialId(credentialStorageKey);
    setCredentialId(storedCredentialId);
    if (
      storedCredentialId &&
      typeof window !== 'undefined' &&
      !window.localStorage.getItem(credentialStorageKey)
    ) {
      window.localStorage.setItem(credentialStorageKey, storedCredentialId);
    }
  }, [credentialStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncCredentialId = (event: StorageEvent) => {
      if (event.key === credentialStorageKey) {
        setCredentialId(event.newValue?.trim() ?? '');
      }
    };

    window.addEventListener('storage', syncCredentialId);
    return () => window.removeEventListener('storage', syncCredentialId);
  }, [credentialStorageKey]);

  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    if (!hasWebAuthnSupport()) {
      return false;
    }
    try {
      return Boolean(await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    } catch {
      return false;
    }
  }, []);

  const enroll = useCallback(
    async (actionName = 'Configura Autenticazione Dispositivo'): Promise<boolean> => {
      if (!hasWebAuthnSupport()) {
        return false;
      }

      try {
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: createChallenge(),
            rp: { name: DEVICE_AUTH_RP_NAME },
            user: userMetadata,
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              residentKey: 'preferred',
            },
            timeout: 60000,
            attestation: 'none',
          },
        });

        if (!credential || !('rawId' in credential)) {
          return false;
        }

        const nextCredentialId = bytesToBase64Url((credential as PublicKeyCredential).rawId);
        window.localStorage.setItem(credentialStorageKey, nextCredentialId);
        setCredentialId(nextCredentialId);
        return true;
      } catch (error) {
        console.warn(`[DeviceAuth] Registrazione fallita o annullata per ${actionName}:`, error);
        return false;
      }
    },
    [credentialStorageKey, userMetadata],
  );

  const authenticate = useCallback(
    async (actionName = 'Autorizza Azione'): Promise<boolean> => {
      if (!hasWebAuthnSupport()) {
        return false;
      }
      if (!credentialId) {
        console.warn(`[DeviceAuth] Nessuna passkey registrata per ${actionName}.`);
        return false;
      }

      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: createChallenge(),
            allowCredentials: [{ id: base64UrlToArrayBuffer(credentialId), type: 'public-key' }],
            timeout: 45000,
            userVerification: 'required',
          },
        });
        return Boolean(credential);
      } catch (error) {
        console.warn(`[DeviceAuth] Autenticazione fallita o annullata per ${actionName}:`, error);
        return false;
      }
    },
    [credentialId],
  );

  const clearCredential = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(credentialStorageKey);
    }
    setCredentialId('');
  }, [credentialStorageKey]);

  const isEnrolled = credentialId.length > 0;

  const verifyOrEnroll = useCallback(
    async (actionName = 'Autorizza Azione'): Promise<boolean> => {
      return isEnrolled ? authenticate(actionName) : enroll(actionName);
    },
    [authenticate, enroll, isEnrolled],
  );

  return useMemo(
    () => ({
      isBiometricAvailable,
      authenticate,
      enroll,
      verifyOrEnroll,
      clearCredential,
      isEnrolled,
      credentialId,
      userMetadata,
    }),
    [
      authenticate,
      clearCredential,
      credentialId,
      enroll,
      isBiometricAvailable,
      isEnrolled,
      userMetadata,
      verifyOrEnroll,
    ],
  );
}
