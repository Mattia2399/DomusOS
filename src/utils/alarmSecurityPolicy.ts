export type AlarmSecurityActionKind =
  | 'arm_home'
  | 'arm_away'
  | 'arm_night'
  | 'arm_vacation'
  | 'arm_custom_bypass'
  | 'disarm'
  | 'trigger';

export type AlarmCodeFormat = 'number' | 'text' | 'unknown';

export type AlarmCredentialKind = 'none' | 'ha_code' | 'combined_code';

export type AlarmActionAuthOptions = {
  deviceAuthVerified?: boolean;
};

export type AlarmSecurityRequirement = {
  credentialKind: AlarmCredentialKind;
  needsCodeInput: boolean;
  needsHaCode: boolean;
  needsDashboardPin: boolean;
  allowsDeviceAuth: boolean;
  risk: 'normal' | 'sensitive' | 'danger';
  codeFormat: AlarmCodeFormat;
  title: string;
  description: string;
  inputLabel: string;
};

export type AlarmManualCodeSubmissionResult =
  | { ok: true; haCode: string | undefined }
  | { ok: false; reason: 'missing' | 'local_extra_mismatch' };

export type ResolveAlarmSecurityRequirementOptions = {
  action: AlarmSecurityActionKind;
  codeArmRequired?: boolean;
  codeFormat?: string | null;
  storedHaPinConfigured?: boolean;
  localExtraPinConfigured?: boolean;
  deviceAuthEnabled?: boolean;
};

const ARM_ACTIONS = new Set<AlarmSecurityActionKind>([
  'arm_home',
  'arm_away',
  'arm_night',
  'arm_vacation',
  'arm_custom_bypass',
]);

function normalizeCodeFormat(codeFormat?: string | null): AlarmCodeFormat {
  if (typeof codeFormat !== 'string') {
    return 'unknown';
  }
  return codeFormat.toLowerCase() === 'text' ? 'text' : 'number';
}

export function isAlarmArmAction(action: AlarmSecurityActionKind) {
  return ARM_ACTIONS.has(action);
}

export function resolveAlarmSecurityRequirement({
  action,
  codeArmRequired = false,
  codeFormat,
  storedHaPinConfigured = false,
  localExtraPinConfigured = false,
  deviceAuthEnabled = false,
}: ResolveAlarmSecurityRequirementOptions): AlarmSecurityRequirement {
  const normalizedCodeFormat = normalizeCodeFormat(codeFormat);
  const entityCanUseCode = normalizedCodeFormat !== 'unknown' || storedHaPinConfigured || codeArmRequired;
  const isSensitiveAction = action === 'disarm' || action === 'trigger';
  const needsAlarmPin =
    (isAlarmArmAction(action) && codeArmRequired) ||
    (isSensitiveAction && (entityCanUseCode || localExtraPinConfigured));
  const allowsDeviceAuth = deviceAuthEnabled && (needsAlarmPin || isSensitiveAction);
  const inputLabel = localExtraPinConfigured ? 'PIN allarme + extra' : 'PIN allarme';

  if (needsAlarmPin) {
    return {
      credentialKind: localExtraPinConfigured ? 'combined_code' : 'ha_code',
      needsCodeInput: true,
      needsHaCode: true,
      needsDashboardPin: localExtraPinConfigured,
      allowsDeviceAuth,
      risk: action === 'trigger' ? 'danger' : action === 'disarm' ? 'sensitive' : 'normal',
      codeFormat: normalizedCodeFormat,
      title: 'Conferma comando',
      description: 'Inserisci il PIN allarme per continuare.',
      inputLabel,
    };
  }

  return {
    credentialKind: 'none',
    needsCodeInput: false,
    needsHaCode: false,
    needsDashboardPin: false,
    allowsDeviceAuth,
    risk: action === 'trigger' ? 'danger' : action === 'disarm' ? 'sensitive' : 'normal',
    codeFormat: normalizedCodeFormat,
    title: 'Conferma comando',
    description: allowsDeviceAuth ? 'Verifica il dispositivo per continuare.' : 'Nessuna conferma richiesta.',
    inputLabel,
  };
}

export function resolveAlarmManualCodeSubmission({
  inputCode,
  localExtraCode,
  requiresCode,
}: {
  inputCode: string;
  localExtraCode?: string;
  requiresCode: boolean;
}): AlarmManualCodeSubmissionResult {
  if (!requiresCode) {
    return { ok: true, haCode: undefined };
  }

  const trimmedCode = inputCode.trim();
  const trimmedLocalExtra = localExtraCode?.trim() ?? '';
  if (!trimmedCode || (trimmedLocalExtra && trimmedCode.length <= trimmedLocalExtra.length)) {
    return { ok: false, reason: 'missing' };
  }

  if (trimmedLocalExtra && !trimmedCode.endsWith(trimmedLocalExtra)) {
    return { ok: false, reason: 'local_extra_mismatch' };
  }

  return {
    ok: true,
    haCode: trimmedLocalExtra ? trimmedCode.slice(0, -trimmedLocalExtra.length) : trimmedCode,
  };
}
