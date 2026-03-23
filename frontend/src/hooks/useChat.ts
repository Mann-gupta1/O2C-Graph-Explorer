import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { sendChatMessage } from '../utils/api';

export function useChat(onNodesReferenced?: (nodeIds: string[]) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome! I can help you explore the SAP Order-to-Cash dataset. Ask me about sales orders, deliveries, billing documents, payments, products, or customers.\n\nTry questions like:\n- "Which products have the most billing documents?"\n- "Show me sales orders that were delivered but not billed"\n- "Trace the flow of billing document 90504248"',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (query: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await sendChatMessage(query);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          sql: response.sql,
          referencedNodes: response.referenced_nodes,
          isRejected: response.is_rejected,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (response.referenced_nodes.length > 0 && onNodesReferenced) {
          onNodesReferenced(response.referenced_nodes);
        }
      } catch (e) {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [onNodesReferenced]
  );

  return { messages, isLoading, sendMessage };
}
