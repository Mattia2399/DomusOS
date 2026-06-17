import { useCallback, useEffect, useRef, useState } from 'react';
import {
  callService as callHaService,
  createConnection,
  createLongLivedTokenAuth,
  ERR_INVALID_AUTH,
  ERR_INVALID_AUTH_CALLBACK,
  getAuth,
  subscribeEntities,
  type Connection,
} from 'home-assistant-js-websocket';
import type { HassEntities } from 'home-assistant-js-websocket';
import {
  clearHassAuthTokensStorage,
  loadHassAuthTokensFromStorage,
  mapHassEntitiesToMock,
  normalizeHassUrl,
  saveHassAuthTokensToStorage,
} from '../services/haLive';
import type { MockEntityStateMap } from '../types/ha';

export type HaConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type HaLiveConnectionOptions = {
  url: string;
  token: string;
};

export type HaArea = {
  area_id: string;
  name: string;
  aliases?: string[];
  floor_id?: string | null;
  humidity_entity_id?: string | null;
  icon?: string | null;
  picture?: string;
  temperature_entity_id?: string | null;
};

function parseAreaRegistryPayload(payload: unknown): HaArea[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => {
      const areaId = typeof entry.area_id === 'string' ? entry.area_id.trim() : '';
      const name = typeof entry.name === 'string' ? entry.name.trim() : '';
      const aliases = Array.isArray(entry.aliases)
        ? entry.aliases.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : undefined;
      const floorId = typeof entry.floor_id === 'string' && entry.floor_id.trim().length > 0 ? entry.floor_id : null;
      const humidityEntityId =
        typeof entry.humidity_entity_id === 'string' && entry.humidity_entity_id.trim().length > 0
          ? entry.humidity_entity_id
          : null;
      const icon = typeof entry.icon === 'string' && entry.icon.trim().length > 0 ? entry.icon : null;
      const picture = typeof entry.picture === 'string' && entry.picture.trim().length > 0 ? entry.picture : undefined;
      const temperatureEntityId =
        typeof entry.temperature_entity_id === 'string' && entry.temperature_entity_id.trim().length > 0
          ? entry.temperature_entity_id
          : null;
      if (!areaId || !name) {
        return null;
      }
      const area: HaArea = {
        area_id: areaId,
        name,
      };
      if (aliases && aliases.length > 0) {
        area.aliases = aliases;
      }
      area.floor_id = floorId;
      area.humidity_entity_id = humidityEntityId;
      area.icon = icon;
      if (picture) {
        area.picture = picture;
      }
      area.temperature_entity_id = temperatureEntityId;
      return area;
    })
    .filter((entry): entry is HaArea => entry !== null);
}

function toHaErrorMessage(error: unknown) {
  if (error === ERR_INVALID_AUTH) {
    return 'Autenticazione Home Assistant non valida o revocata.';
  }
  if (error === ERR_INVALID_AUTH_CALLBACK) {
    return 'Callback OAuth Home Assistant non valido.';
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Connessione Home Assistant fallita.';
}

function shouldResetOAuthTokens(error: unknown) {
  if (error === ERR_INVALID_AUTH || error === ERR_INVALID_AUTH_CALLBACK) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('invalid auth') ||
    message.includes('invalid authentication') ||
    message.includes('revoked') ||
    message.includes('callback')
  );
}

export function useHaLiveConnection({ url, token }: HaLiveConnectionOptions) {
  const [status, setStatus] = useState<HaConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [haStates, setHaStates] = useState<MockEntityStateMap>({});
  const [haAreas, setHaAreas] = useState<HaArea[]>([]);
  const connectionRef = useRef<Connection | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const disconnect = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    connectionRef.current?.close();
    connectionRef.current = null;
    setStatus('disconnected');
    setError(null);
    setHaStates({});
    setHaAreas([]);
  }, []);

  const connect = useCallback(async () => {
    const hassUrl = normalizeHassUrl(url);
    const tokenValue = token.trim();

    if (!hassUrl) {
      setStatus('error');
      setError('URL Home Assistant e obbligatorio.');
      return;
    }

    disconnect();
    setStatus('connecting');
    setError(null);

    try {
      const auth = tokenValue
        ? createLongLivedTokenAuth(hassUrl, tokenValue)
        : await getAuth({
            hassUrl,
            clientId: typeof window !== 'undefined' ? window.location.origin : null,
            saveTokens: saveHassAuthTokensToStorage,
            loadTokens: loadHassAuthTokensFromStorage,
            limitHassInstance: true,
          });
      const connection = await createConnection({ auth, setupRetry: 2 });
      const unsubscribe = subscribeEntities(connection, (entities: HassEntities) => {
        setHaStates((current) => mapHassEntitiesToMock(entities, hassUrl, current));
      });

      connectionRef.current = connection;
      unsubscribeRef.current = unsubscribe;
      const areaRegistry = await connection.sendMessagePromise<unknown>({
        type: 'config/area_registry/list',
      });
      setHaAreas(parseAreaRegistryPayload(areaRegistry));
      setStatus('connected');
    } catch (err) {
      if (!tokenValue && shouldResetOAuthTokens(err)) {
        clearHassAuthTokensStorage();
        if (typeof window !== 'undefined') {
          void getAuth({
            hassUrl,
            clientId: window.location.origin,
            saveTokens: saveHassAuthTokensToStorage,
            loadTokens: async () => undefined,
            limitHassInstance: true,
          }).catch(() => undefined);
        }
      }
      setStatus('error');
      setError(toHaErrorMessage(err));
      setHaAreas([]);
    }
  }, [disconnect, token, url]);

  const callService = useCallback(
    async (domain: string, service: string, serviceData: Record<string, unknown>) => {
      if (!connectionRef.current) {
        setError('Connessione Home Assistant non disponibile.');
        return false;
      }

      try {
        await callHaService(connectionRef.current, domain, service, serviceData);
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Richiesta Home Assistant fallita.');
        return false;
      }
    },
    [],
  );

  const callApi = useCallback(
    async <TResponse = unknown>(
      message: Record<string, unknown>,
      options?: { reportError?: boolean },
    ) => {
      if (!connectionRef.current) {
        if (options?.reportError !== false) {
          setError('Connessione Home Assistant non disponibile.');
        }
        return null;
      }

      try {
        const response = await connectionRef.current.sendMessagePromise<TResponse>(
          message as never,
        );
        if (options?.reportError !== false) {
          setError(null);
        }
        return response;
      } catch (err) {
        if (options?.reportError !== false) {
          setError(err instanceof Error ? err.message : 'Richiesta Home Assistant fallita.');
        }
        return null;
      }
    },
    [],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    status,
    error,
    haStates,
    haAreas,
    connect,
    disconnect,
    callService,
    callApi,
  };
}
