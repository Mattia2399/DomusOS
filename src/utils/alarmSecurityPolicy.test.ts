import { describe, expect, it } from 'vitest';
import { resolveAlarmManualCodeSubmission, resolveAlarmSecurityRequirement } from './alarmSecurityPolicy';

describe('alarm security policy', () => {
  it('asks for the alarm PIN when Home Assistant requires a code for arm actions', () => {
    const requirement = resolveAlarmSecurityRequirement({
      action: 'arm_away',
      codeArmRequired: true,
      codeFormat: 'number',
      storedHaPinConfigured: true,
      deviceAuthEnabled: true,
    });

    expect(requirement).toMatchObject({
      credentialKind: 'ha_code',
      needsCodeInput: true,
      needsHaCode: true,
      needsDashboardPin: false,
      allowsDeviceAuth: true,
      inputLabel: 'PIN allarme',
      codeFormat: 'number',
    });
  });

  it('uses a combined code when the local extra code is configured', () => {
    const requirement = resolveAlarmSecurityRequirement({
      action: 'disarm',
      codeFormat: 'number',
      storedHaPinConfigured: true,
      localExtraPinConfigured: true,
      deviceAuthEnabled: true,
    });

    expect(requirement).toMatchObject({
      credentialKind: 'combined_code',
      needsCodeInput: true,
      needsHaCode: true,
      needsDashboardPin: true,
      allowsDeviceAuth: true,
      inputLabel: 'PIN allarme + extra',
      risk: 'sensitive',
    });
  });

  it('can protect disarm with only device auth when no alarm PIN is known', () => {
    const requirement = resolveAlarmSecurityRequirement({
      action: 'disarm',
      deviceAuthEnabled: true,
    });

    expect(requirement).toMatchObject({
      credentialKind: 'none',
      needsCodeInput: false,
      allowsDeviceAuth: true,
      risk: 'sensitive',
    });
  });

  it('treats trigger as a critical command and accepts the same alarm PIN flow', () => {
    const requirement = resolveAlarmSecurityRequirement({
      action: 'trigger',
      codeFormat: 'number',
      localExtraPinConfigured: true,
      deviceAuthEnabled: true,
    });

    expect(requirement).toMatchObject({
      credentialKind: 'combined_code',
      needsCodeInput: true,
      needsHaCode: true,
      needsDashboardPin: true,
      allowsDeviceAuth: true,
      risk: 'danger',
    });
  });

  it('requires device auth for trigger when no alarm PIN is known but device auth is enabled', () => {
    const requirement = resolveAlarmSecurityRequirement({
      action: 'trigger',
      deviceAuthEnabled: true,
    });

    expect(requirement).toMatchObject({
      credentialKind: 'none',
      needsCodeInput: false,
      allowsDeviceAuth: true,
      risk: 'danger',
    });
  });

  it('extracts only the Home Assistant PIN from a combined dashboard code', () => {
    expect(
      resolveAlarmManualCodeSubmission({
        inputCode: '123499',
        localExtraCode: '99',
        storedHaCode: '1234',
        requiresCode: true,
      }),
    ).toEqual({ ok: true, haCode: '1234' });
  });

  it('rejects combined codes with a wrong local extra without exposing which part failed', () => {
    expect(
      resolveAlarmManualCodeSubmission({
        inputCode: '123488',
        localExtraCode: '99',
        storedHaCode: '1234',
        requiresCode: true,
      }),
    ).toEqual({ ok: false, reason: 'credential_mismatch' });
  });

  it('rejects a different Home Assistant PIN before sending the service call', () => {
    expect(
      resolveAlarmManualCodeSubmission({
        inputCode: '9999',
        storedHaCode: '1234',
        requiresCode: true,
      }),
    ).toEqual({ ok: false, reason: 'credential_mismatch' });
  });
});
