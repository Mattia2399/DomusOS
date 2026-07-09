import type { Widget } from '../types/dashboardModels';

export const WIDGET_SECRETS_STORAGE_KEY = 'ha.dashboard.secrets.widgetCodes.v1';

const WIDGET_SECRETS_VERSION = 1;
const WIDGET_SECRET_FIELDS = ['alarmUnlockCode', 'alarmLocalExtraCode', 'lockCode'] as const;

type WidgetSecretField = (typeof WIDGET_SECRET_FIELDS)[number];
type WidgetSecretRecord = Partial<Record<WidgetSecretField, string>>;

type WidgetSecretsPayload = {
  version: typeof WIDGET_SECRETS_VERSION;
  widgets: Record<string, WidgetSecretRecord>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSecretRecord(value: unknown): WidgetSecretRecord {
  if (!isRecord(value)) {
    return {};
  }

  const record: WidgetSecretRecord = {};
  WIDGET_SECRET_FIELDS.forEach((field) => {
    const entryValue = value[field];
    if (typeof entryValue === 'string' && entryValue.trim().length > 0) {
      record[field] = entryValue;
    }
  });
  return record;
}

function hasSecretRecordValue(record: WidgetSecretRecord) {
  return WIDGET_SECRET_FIELDS.some((field) => typeof record[field] === 'string' && record[field]!.trim().length > 0);
}

function readWidgetSecretsPayload(storage: Storage): WidgetSecretsPayload {
  try {
    const parsed = JSON.parse(storage.getItem(WIDGET_SECRETS_STORAGE_KEY) ?? '') as unknown;
    if (!isRecord(parsed) || parsed.version !== WIDGET_SECRETS_VERSION || !isRecord(parsed.widgets)) {
      return { version: WIDGET_SECRETS_VERSION, widgets: {} };
    }

    const widgets: Record<string, WidgetSecretRecord> = {};
    Object.entries(parsed.widgets).forEach(([widgetId, value]) => {
      const normalized = normalizeSecretRecord(value);
      if (widgetId.trim().length > 0 && hasSecretRecordValue(normalized)) {
        widgets[widgetId] = normalized;
      }
    });
    return { version: WIDGET_SECRETS_VERSION, widgets };
  } catch {
    return { version: WIDGET_SECRETS_VERSION, widgets: {} };
  }
}

function writeWidgetSecretsPayload(storage: Storage, payload: WidgetSecretsPayload) {
  if (Object.keys(payload.widgets).length === 0) {
    storage.removeItem(WIDGET_SECRETS_STORAGE_KEY);
    return;
  }
  storage.setItem(WIDGET_SECRETS_STORAGE_KEY, JSON.stringify(payload));
}

function extractWidgetSecretRecord(widget: Widget): WidgetSecretRecord {
  const record: WidgetSecretRecord = {};
  WIDGET_SECRET_FIELDS.forEach((field) => {
    const value = widget[field];
    if (typeof value === 'string' && value.trim().length > 0) {
      record[field] = value;
    }
  });
  return record;
}

export function stripWidgetSecretsFromWidgets(widgets: Widget[]): Widget[] {
  return widgets.map((widget) => {
    const {
      alarmUnlockCode: _alarmUnlockCode,
      alarmLocalExtraCode: _alarmLocalExtraCode,
      lockCode: _lockCode,
      ...safeWidget
    } = widget;
    return safeWidget;
  });
}

export function persistWidgetSecretsFromWidgets(widgets: Widget[], storage: Storage) {
  const nextWidgets: Record<string, WidgetSecretRecord> = {};
  widgets.forEach((widget) => {
    const record = extractWidgetSecretRecord(widget);
    if (hasSecretRecordValue(record)) {
      nextWidgets[widget.id] = record;
    }
  });

  writeWidgetSecretsPayload(storage, {
    version: WIDGET_SECRETS_VERSION,
    widgets: nextWidgets,
  });
}

export function migrateLegacyWidgetSecretsFromWidgets(widgets: Widget[], storage: Storage) {
  const currentPayload = readWidgetSecretsPayload(storage);
  let changed = false;

  widgets.forEach((widget) => {
    const legacyRecord = extractWidgetSecretRecord(widget);
    if (!hasSecretRecordValue(legacyRecord)) {
      return;
    }
    const currentRecord = currentPayload.widgets[widget.id] ?? {};
    const nextRecord = { ...currentRecord, ...legacyRecord };
    currentPayload.widgets[widget.id] = nextRecord;
    changed = true;
  });

  if (changed) {
    writeWidgetSecretsPayload(storage, currentPayload);
  }
}

export function mergeWidgetSecretsIntoWidgets(widgets: Widget[], storage: Storage): Widget[] {
  const payload = readWidgetSecretsPayload(storage);
  return widgets.map((widget) => {
    const record = payload.widgets[widget.id];
    if (!record || !hasSecretRecordValue(record)) {
      return widget;
    }
    return {
      ...widget,
      ...record,
    };
  });
}
