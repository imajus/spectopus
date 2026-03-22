import { openai } from '@ai-sdk/openai';

export const model = openai(process.env.OPENAI_MODEL ?? 'gpt-4.1-mini');
