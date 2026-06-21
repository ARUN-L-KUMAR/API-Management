import { ProviderAdapter } from './provider.interface';
import { OpenAIAdapter } from './openai.adapter';
import { GeminiAdapter } from './gemini.adapter';
import { AnthropicAdapter } from './anthropic.adapter';
import { OpenRouterAdapter } from './openrouter.adapter';
import { DeepSeekAdapter } from './deepseek.adapter';
import { TogetherAdapter } from './together.adapter';
import { GroqAdapter } from './groq.adapter';
import { ElevenLabsAdapter } from './elevenlabs.adapter';
import { DoubleWorldAdapter } from './doubleworld.adapter';
import { OpenCodeAdapter } from './opencode.adapter';
import { CloudinaryAdapter } from './cloudinary.adapter';
import { TelegramAdapter } from './telegram.adapter';
import { GoogleCloudAdapter } from './googlecloud.adapter';

export class ProviderAdapterFactory {
  private static adapters: Record<string, ProviderAdapter> = {
    openai: new OpenAIAdapter(),
    gemini: new GeminiAdapter(),
    anthropic: new AnthropicAdapter(),
    openrouter: new OpenRouterAdapter(),
    deepseek: new DeepSeekAdapter(),
    together: new TogetherAdapter(),
    groq: new GroqAdapter(),
    elevenlabs: new ElevenLabsAdapter(),
    doubleworld: new DoubleWorldAdapter(),
    opencode: new OpenCodeAdapter(),
    cloudinary: new CloudinaryAdapter(),
    telegram: new TelegramAdapter(),
    googlecloud: new GoogleCloudAdapter(),
  };

  static getAdapter(providerCode: string): ProviderAdapter {
    const code = providerCode.toLowerCase().replace(/[\s-_]/g, '');
    const adapter = this.adapters[code];
    if (!adapter) {
      throw new Error(`Unsupported provider code: ${providerCode}`);
    }
    return adapter;
  }
}
