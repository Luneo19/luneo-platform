'use client';

import { useState, useCallback } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface UseFeedbackReturn {
  submitFeedback: (
    messageId: string,
    rating: number,
    comment?: string,
    category?: 'helpful' | 'accurate' | 'fast' | 'other',
  ) => Promise<boolean>;
  isSubmitting: boolean;
  submittedMessages: Set<string>;
}

export function useFeedback(): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessages, setSubmittedMessages] = useState<Set<string>>(new Set());

  const submitFeedback = useCallback(
    async (
      messageId: string,
      rating: number,
      comment?: string,
      category?: 'helpful' | 'accurate' | 'fast' | 'other',
    ): Promise<boolean> => {
      if (submittedMessages.has(messageId)) return true;

      setIsSubmitting(true);
      try {
        await endpoints.agents.feedback({ messageId, rating, comment, category });
        setSubmittedMessages((prev) => new Set(prev).add(messageId));
        return true;
      } catch (err) {
        logger.error('Failed to submit feedback', { error: err });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submittedMessages],
  );

  return { submitFeedback, isSubmitting, submittedMessages };
}
