export const SECURITY_AUTH_MODE_STORAGE_KEY = 'ha.dashboard.security.authMode';
export const SECURITY_BIOMETRIC_CREDENTIAL_STORAGE_KEY = 'ha.dashboard.security.biometricCredentialId';
export const SECURITY_SETTINGS_CHANGE_EVENT = 'ha-dashboard-security-settings-change';

export type SecurityAuthMode = 'auto' | 'biometric' | 'pin';

function emitSecuritySettingsChange() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(SECURITY_SETTINGS_CHANGE_EVENT));
}

function hasBrowserBiometricApis() {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.credentials)
  );
}

function createRandomBuffer(length = 32) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = window.atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

export function readSecurityAuthMode(storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  const raw = storage?.getItem(SECURITY_AUTH_MODE_STORAGE_KEY);
  return raw === 'pin' || raw === 'biometric' ? raw : 'auto';
}

export function writeSecurityAuthMode(
  mode: SecurityAuthMode,
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined,
) {
  if (!storage) {
    return;
  }
  if (mode === 'auto') {
    storage.removeItem(SECURITY_AUTH_MODE_STORAGE_KEY);
  } else {
    storage.setItem(SECURITY_AUTH_MODE_STORAGE_KEY, mode);
  }
  emitSecuritySettingsChange();
}

export function readSecurityBiometricCredentialId(
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined,
) {
  return storage?.getItem(SECURITY_BIOMETRIC_CREDENTIAL_STORAGE_KEY)?.trim() ?? '';
}

export async function isPlatformBiometricAvailable() {
  if (!hasBrowserBiometricApis()) {
    return false;
  }
  try {
    return Boolean(await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

export async function verifyStoredBiometricCredential(credentialId: string) {
  const trimmedCredentialId = credentialId.trim();
  if (!trimmedCredentialId || !hasBrowserBiometricApis()) {
    return false;
  }
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: createRandomBuffer(32),
        allowCredentials: [{ id: fromBase64Url(trimmedCredentialId), type: 'public-key' }],
        timeout: 45000,
        userVerification: 'required',
      },
    });
    return Boolean(credential);
  } catch {
    return false;
  }
}

export async function createStoredBiometricCredential() {
  if (!hasBrowserBiometricApis()) {
    return '';
  }
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: createRandomBuffer(32),
        rp: { name: 'Smart Home Dashboard' },
        user: { id: createRandomBuffer(16), name: 'lock-card', displayName: 'Lock Card' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
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
      return '';
    }
    return toBase64Url((credential as PublicKeyCredential).rawId);
  } catch {
    return '';
  }
}

export function writeSecurityBiometricCredentialId(
  credentialId: string,
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined,
) {
  const trimmedCredentialId = credentialId.trim();
  if (!storage) {
    return;
  }
  if (!trimmedCredentialId) {
    storage.removeItem(SECURITY_BIOMETRIC_CREDENTIAL_STORAGE_KEY);
    emitSecuritySettingsChange();
    return;
  }
  storage.setItem(SECURITY_BIOMETRIC_CREDENTIAL_STORAGE_KEY, trimmedCredentialId);
  emitSecuritySettingsChange();
}
