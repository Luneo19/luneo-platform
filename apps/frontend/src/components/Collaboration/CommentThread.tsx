/**
 * Comment Thread Component
 * C-007: Système de commentaires sur canvas
 */

'use client';

import React, { useState, useCallback, useRef, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  MessageSquare,
  Send,
  X,
  Check,
  MoreHorizontal,
  Smile,
  AtSign,
  Reply,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Comment } from '@/lib/collaboration/types';
import { useI18n } from '@/i18n/useI18n';

interface CommentThreadProps {
  comments: Comment[];
  currentUserId: string;
  position?: { x: number; y: number };
  onAddComment: (content: string, options?: {
    parentId?: string;
    mentions?: string[];
  }) => Promise<Comment | null>;
  onResolve: (commentId: string) => void;
  onReact: (commentId: string, emoji: string) => void;
  onClose?: () => void;
  isFloating?: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '🤔', '👀', '🚀'];

function CommentThreadComponent({
  comments,
  currentUserId,
  position,
  onAddComment,
  onResolve,
  onReact,
  onClose,
  isFloating = false,
}: CommentThreadProps) {
  const { t } = useI18n();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Optimisé: useMemo pour parentComments
  const parentComments = useMemo(() => {
    return comments.filter((c) => !c.parentId);
  }, [comments]);
  
  // Optimisé: useCallback pour getReplies
  const getReplies = useCallback((parentId: string) => {
    return comments.filter((c) => c.parentId === parentId);
  }, [comments]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[1]);
    }

    const result = await onAddComment(newComment, {
      parentId: replyingTo || undefined,
      mentions,
    });

    if (result) {
      setNewComment('');
      setReplyingTo(null);
    }

    setIsSubmitting(false);
  }, [newComment, replyingTo, isSubmitting, onAddComment]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Format time
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return new Date(timestamp).toLocaleDateString('fr-FR');
  };

  // Comment item component
  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const replies = getReplies(comment.id);
    const isOwn = comment.authorId === currentUserId;

    return (
      <div className={`${isReply ? 'ml-8 mt-2' : ''}`}>
        <div className={`p-3 rounded-lg ${comment.resolved ? 'bg-green-500/10' : 'bg-slate-800/50'}`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                <AvatarFallback className="text-xs bg-slate-700">
                  {comment.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium">{comment.author.name}</span>
                <span className="text-xs text-slate-500 ml-2">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {comment.resolved && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Comment options">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  {!comment.resolved && (
                    <DropdownMenuItem onClick={() => onResolve(comment.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Marquer résolu
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setReplyingTo(comment.id)}>
                    <Reply className="w-4 h-4 mr-2" />
                    Répondre
                  </DropdownMenuItem>
                  {isOwn && (
                    <DropdownMenuItem className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm mt-2 text-slate-300 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Reactions */}
          {comment.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(
                comment.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => onReact(comment.id, emoji)}
                  className="px-2 py-0.5 text-xs rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
              >
                <Smile className="w-3 h-3 mr-1" />
                Réagir
              </Button>
              <AnimatePresence>
                {showReactions === comment.id && (
                  <motion
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-1 p-1 bg-slate-700 rounded-lg flex gap-1 shadow-lg"
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReact(comment.id, emoji);
                          setShowReactions(null);
                        }}
                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion>
                )}
              </AnimatePresence>
            </div>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Répondre
              </Button>
            )}
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-2 mt-2">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden
        ${isFloating ? 'absolute w-80' : 'w-full max-w-md'}
      `}
      style={isFloating && position ? { left: position.x, top: position.y } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="font-medium">
            {comments.length} commentaire{comments.length > 1 ? 's' : ''}
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto p-3 space-y-3">
        {parentComments.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-4">
            Aucun commentaire pour l'instant
          </p>
        ) : (
          parentComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-2 py-1 bg-slate-800/50 rounded text-xs">
            <span className="text-slate-400">
              Réponse à {comments.find((c) => c.id === replyingTo)?.author.name}
            </span>
            <button onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('common.addComment')}
            className="flex-1 min-h-[36px] max-h-24 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-slate-400">
            <AtSign className="w-3 h-3 mr-1" />
            Mentionner
          </Button>
        </div>
      </div>
    </motion>
  );
}

const CommentThreadMemo = memo(CommentThreadComponent);

export function CommentThread(props: CommentThreadProps) {
  return (
    <ErrorBoundary componentName="CommentThread">
      <CommentThreadMemo {...props} />
    </ErrorBoundary>
  );
}

export default CommentThread;


