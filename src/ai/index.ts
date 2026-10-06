import type { AIProvider } from './types';
import { MockAIProvider } from './MockAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { BACKEND_URL } from '../config/publicConfig';

export type {
  AIProvider,
  ExtractedFollowUp,
  ImageMediaType,
  ReminderMessageInput,
  ReminderTone,
  TranscriptionResult,
} from './types';
export { AIRequestError } from './types';

const backendUrl = BACKEND_URL;
const appSecret = process.env.EXPO_PUBLIC_APP_SHARED_SECRET;

export const aiProvider: AIProvider = backendUrl
  ? new AnthropicProvider(backendUrl, appSecret)
  : new MockAIProvider();

export const isUsingMockAI = !backendUrl;
