import { createOpenAI } from '@ai-sdk/openai';

const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

// Vercel AI SDK OpenAI provider - for chat with GPT-5
export const openai = createOpenAI({
  apiKey: openaiApiKey,
});

// Default models
export const MODELS = {
  chat: 'gpt-5.2-chat-latest',
} as const;
