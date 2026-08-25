import type { AIProvider } from './types';
import { MockAIProvider } from './MockAIProvider';
import { AnthropicProvider } from './AnthropicProvider';

export type { AIProvider, ExtractedFollowUp, ImageMediaType, TranscriptionResult } from './types';

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const appSecret = process.env.EXPO_PUBLIC_APP_SHARED_SECRET;

export const aiProvider: AIProvider = backendUrl
  ? new AnthropicProvider(backendUrl, appSecret)
  : new MockAIProvider();

export const isUsingMockAI = !backendUrl;
