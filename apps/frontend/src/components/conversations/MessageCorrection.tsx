'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface MessageCorrectionProps {
  agentId: string;
  messageId: string;
  conversationId: string;
  originalContent: string;
  userQuestion?: string;
}

export function MessageCorrection({
  agentId,
  messageId,
  conversationId,
  originalContent,
  userQuestion,
}: MessageCorrectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [correctedText, setCorrectedText] = useState(originalContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const mutation = useMutation({
    mutationFn: async (corrected: string) => {
      return api.post(`/api/v1/agents/${agentId}/corrections`, {
        messageId,
        conversationId,
        originalContent,
        correctedContent: corrected,
        userQuestion,
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId] });
    },
  });

  const handleSave = () => {
    if (correctedText.trim() && correctedText !== originalContent) {
      mutation.mutate(correctedText);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setCorrectedText(originalContent);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 hover:text-white"
        title="Corriger cette réponse"
      >
        <Pencil className="h-3 w-3" />
        Corriger
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3">
      <p className="mb-2 text-xs font-medium text-indigo-400">Correction de la réponse :</p>
      <textarea
        ref={textareaRef}
        value={correctedText}
        onChange={(e) => {
          setCorrectedText(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        className="w-full resize-none rounded border border-white/10 bg-white/5 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
        rows={3}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Enregistrer
        </button>
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs text-gray-400 transition-colors hover:text-white"
        >
          <X className="h-3 w-3" />
          Annuler
        </button>
        {mutation.isError && (
          <span className="text-xs text-red-400">Erreur lors de la sauvegarde</span>
        )}
      </div>
    </div>
  );
}
