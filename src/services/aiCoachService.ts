/**
 * AI Coach Service
 * Client-side service for communicating with the server-side Gemini coach.
 * Handles conversation memory, message sending, tool result normalization.
 */

import { AICoachResponse } from '../types';

export interface AICoachMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICoachToolResult {
  toolName: string;
  toolArgs: Record<string, unknown>;
  success: boolean;
  actionTaken?: string;
  message: string;
  data?: unknown;
  requiresConfirmation?: boolean;
  confirmationPayload?: Record<string, unknown>;
}

export interface AICoachSendResult {
  message: string;
  toolResults: AICoachToolResult[];
  requiresConfirmation: boolean;
  source: string;
}

export class AICoachService {
  /**
   * Send messages to the AI Coach with function calling support.
   * Returns normalized response with tool results.
   */
  static async sendMessage(
    userId: string,
    messages: AICoachMessage[],
    language: 'en' | 'ar',
    conversationId?: string
  ): Promise<AICoachSendResult> {
    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          userId,
          language,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Coach request failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        message: data.reply || '',
        toolResults: (data.toolResults || []).map((tr: any) => ({
          toolName: tr.toolName || '',
          toolArgs: tr.toolArgs || {},
          success: tr.success,
          actionTaken: tr.actionTaken,
          message: tr.message,
          data: tr.data,
          requiresConfirmation: tr.requiresConfirmation,
          confirmationPayload: tr.confirmationPayload,
        })),
        requiresConfirmation: data.requiresConfirmation || false,
        source: data.source || 'unknown',
      };
    } catch (err: any) {
      console.error('AICoachService sendMessage error:', err);
      const isAr = language === 'ar';
      return {
        message: isAr
          ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
          : 'An unexpected error occurred. Please try again.',
        toolResults: [],
        requiresConfirmation: false,
        source: 'error',
      };
    }
  }

  /**
   * Get user's conversation list.
   */
  static async getConversations(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/conversations/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      return data.conversations || [];
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      return [];
    }
  }

  /**
   * Create a new conversation.
   */
  static async createConversation(
    userId: string,
    title: string,
    titleAr?: string
  ): Promise<any> {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, titleAr }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      return data.conversation;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }

  /**
   * Delete a conversation.
   */
  static async deleteConversation(userId: string, convId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/conversations/${userId}/${convId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      return false;
    }
  }

  /**
   * Generate a title for a conversation based on its first message.
   */
  static generateConversationTitle(firstMessage: string, language: 'en' | 'ar'): string {
    if (!firstMessage || firstMessage.length === 0) {
      return language === 'ar' ? 'دردشة جديدة' : 'New Chat';
    }

    // Truncate to 40 chars for title
    const title = firstMessage.slice(0, 40);
    const suffix = firstMessage.length > 40 ? '...' : '';
    return title + suffix;
  }

  /**
   * Normalize the raw server response into AICoachResponse.
   */
  static normalizeResponse(raw: any, language: 'en' | 'ar'): AICoachResponse {
    return {
      message: raw.reply || '',
      language,
      actions: raw.toolResults || [],
      requiresConfirmation: raw.requiresConfirmation || false,
      toolResults: raw.toolResults || [],
    };
  }
}
