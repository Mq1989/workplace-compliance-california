import OpenAI from 'openai';

/**
 * Lazy-initialize the OpenAI client to avoid build-time errors
 * when OPENAI_API_KEY is not available during static prerendering.
 * Same singleton pattern used by Stripe integration.
 */
let _openai;

export function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}
