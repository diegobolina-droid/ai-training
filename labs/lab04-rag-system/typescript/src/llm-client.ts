/**
 * LLM Client Abstraction
 */

import { Anthropic } from '@anthropic-ai/sdk';
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages.js';
import { OpenAI } from 'openai';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class LLMClient {
  abstract chat(messages: Message[]): Promise<string>;
}

export class AnthropicClient extends LLMClient {
  private client: InstanceType<typeof Anthropic> | null = null;
  private model: string;

  constructor(model: string = 'claude-sonnet-4-20250514') {
    super();
    this.model = model;
  }

  private async ensureClient(): Promise<void> {
    if (!this.client) {
      this.client = new Anthropic();
    }
  }

  async chat(messages: Message[]): Promise<string> {
    await this.ensureClient();

    let system: string | undefined;
    const filtered: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const m of messages) {
      if (m.role === 'system') {
        system = m.content;
      } else {
        filtered.push({ role: m.role, content: m.content });
      }
    }

    const response = await this.client!.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: filtered,
    });

    const textBlock = response.content.find((block: ContentBlock) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }
}

export class OpenAIClient extends LLMClient {
  private client: InstanceType<typeof OpenAI> | null = null;
  private model: string;

  constructor(model: string = 'gpt-4o') {
    super();
    this.model = model;
  }

  private async ensureClient(): Promise<void> {
    if (!this.client) {
      this.client = new OpenAI();
    }
  }

  async chat(messages: Message[]): Promise<string> {
    await this.ensureClient();

    const response = await this.client!.chat.completions.create({
      model: this.model,
      messages,
    });

    return response.choices[0].message.content || '';
  }
}

export type LLMProvider = 'anthropic' | 'openai';

export function getLLMClient(provider: LLMProvider = 'anthropic'): LLMClient {
  switch (provider) {
    case 'anthropic':
      return new AnthropicClient();
    case 'openai':
      return new OpenAIClient();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
