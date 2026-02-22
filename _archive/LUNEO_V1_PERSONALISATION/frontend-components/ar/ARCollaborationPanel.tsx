'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Copy, LogOut, MessageSquare, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'owner' | 'editor' | 'viewer';
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export interface Annotation {
  id: string;
  userId: string;
  text: string;
  position?: { x: number; y: number; z: number };
}

export interface ARCollaborationPanelProps {
  roomId: string;
  roomStatus?: 'waiting' | 'active';
  participants?: Participant[];
  messages?: ChatMessage[];
  annotations?: Annotation[];
  inviteLink?: string;
  onLeave?: () => void;
  onEndRoom?: () => void;
  onSendMessage?: (text: string) => void;
  trigger?: React.ReactNode;
  className?: string;
}

export function ARCollaborationPanel({
  roomId,
  roomStatus = 'waiting',
  participants = [],
  messages = [],
  annotations = [],
  inviteLink,
  onLeave,
  onEndRoom,
  onSendMessage,
  trigger,
  className,
}: ARCollaborationPanelProps) {
  const [open, setOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const { toast } = useToast();

  const handleCopyInvite = useCallback(() => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(
      () => toast({ title: 'Invite link copied' }),
      () => toast({ title: 'Copy failed', variant: 'destructive' })
    );
  }, [inviteLink, toast]);

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !onSendMessage) return;
    onSendMessage(text);
    setChatInput('');
  }, [chatInput, onSendMessage]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" aria-label="Open collaboration panel">
            <Users className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className={`flex flex-col w-full sm:max-w-md ${className ?? ''}`}>
        <SheetHeader>
          <SheetTitle>Collaboration</SheetTitle>
          <SheetDescription>
            Room {roomId} · {roomStatus === 'waiting' ? 'Waiting for participants' : 'Active'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({participants.length})
            </h3>
            <ScrollArea className="h-24 rounded-md border p-2">
              <ul className="space-y-2">
                {participants.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{p.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{p.name}</span>
                    {p.role && <span className="text-muted-foreground text-xs">({p.role})</span>}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          {inviteLink && (
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} className="text-xs font-mono truncate" aria-label="Invite link" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyInvite} aria-label="Copy invite link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </h3>
            <ScrollArea className="flex-1 rounded-md border p-2 min-h-[120px]">
              <ul className="space-y-2 text-sm">
                {messages.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium">{m.userName}:</span> {m.text}
                  </li>
                ))}
              </ul>
            </ScrollArea>
            {onSendMessage && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Type a message…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  aria-label="Chat message"
                />
                <Button type="button" size="sm" onClick={handleSend}>
                  Send
                </Button>
              </div>
            )}
          </div>

          {annotations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Annotations</h3>
              <ScrollArea className="h-20 rounded-md border p-2">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {annotations.map((a) => (
                    <li key={a.id}>{a.text}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {onLeave && (
              <Button type="button" variant="outline" className="gap-2" onClick={onLeave}>
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            )}
            {onEndRoom && (
              <Button type="button" variant="destructive" className="gap-2" onClick={onEndRoom}>
                <X className="h-4 w-4" />
                End room
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
