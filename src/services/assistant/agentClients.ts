export type AgentChatContext = {
  conversationId?: string;
  agentId?: string;
};

export type AgentChatResponse = {
  text: string;
  conversationId?: string;
  raw?: unknown;
};

export type AssistantAgentClient = {
  id: string;
  label: string;
  isReady: boolean;
  sendText: (text: string, context?: AgentChatContext) => Promise<AgentChatResponse>;
};

export type HaApiCaller = <TResponse = unknown>(
  message: Record<string, unknown>,
  options?: { reportError?: boolean },
) => Promise<TResponse | null>;

type HomeAssistantAssistParams = {
  callApi: HaApiCaller;
  isConnected: boolean;
  language?: string;
  agentId?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function resolveReplyFromAssistPayload(payload: unknown) {
  const root = asRecord(payload);
  if (!root) {
    return '';
  }
  const response = asRecord(root.response);
  const speech = asRecord(response?.speech);
  const plain = asRecord(speech?.plain);
  const ssml = asRecord(speech?.ssml);
  const card = asRecord(response?.card);

  const plainSpeech = typeof plain?.speech === 'string' ? plain.speech.trim() : '';
  if (plainSpeech) {
    return plainSpeech;
  }
  const ssmlSpeech = typeof ssml?.speech === 'string' ? ssml.speech.trim() : '';
  if (ssmlSpeech) {
    return ssmlSpeech;
  }
  const cardContent = typeof card?.content === 'string' ? card.content.trim() : '';
  if (cardContent) {
    return cardContent;
  }
  const responseType = typeof response?.response_type === 'string' ? response.response_type.trim() : '';
  if (responseType) {
    return `Risposta Assist: ${responseType}`;
  }
  return '';
}

function resolveConversationId(payload: unknown) {
  const root = asRecord(payload);
  if (!root) {
    return undefined;
  }
  const value = root.conversation_id;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return value;
}

export function createHomeAssistantAssistAgentClient({
  callApi,
  isConnected,
  language = 'it',
  agentId,
}: HomeAssistantAssistParams): AssistantAgentClient {
  return {
    id: 'home-assistant-assist',
    label: 'Home Assistant Assist',
    isReady: isConnected,
    sendText: async (text, context) => {
      if (!isConnected) {
        throw new Error('Home Assistant non connesso.');
      }

      const message: Record<string, unknown> = {
        type: 'conversation/process',
        text,
        language,
      };
      if (context?.conversationId) {
        message.conversation_id = context.conversationId;
      }
      const requestedAgentId = context?.agentId?.trim() || agentId?.trim() || '';
      if (requestedAgentId.length > 0) {
        message.agent_id = requestedAgentId;
      }

      const payload = await callApi<unknown>(message, { reportError: false });
      if (payload === null) {
        throw new Error('Assist non ha restituito una risposta valida.');
      }

      const textReply = resolveReplyFromAssistPayload(payload);
      const conversationId = resolveConversationId(payload);
      return {
        text: textReply || 'Comando ricevuto da Home Assistant Assist.',
        conversationId,
        raw: payload,
      };
    },
  };
}

export function createDemoAgentClient(): AssistantAgentClient {
  return {
    id: 'demo-offline-agent',
    label: 'Assistente Demo',
    isReady: true,
    sendText: async (text, context) => {
      const normalized = text.trim();
      return {
        text: normalized
          ? `Modalita demo: ho ricevuto "${normalized}". Collega Home Assistant per usare Assist reale.`
          : 'Modalita demo attiva.',
        conversationId: context?.conversationId,
      };
    },
  };
}
