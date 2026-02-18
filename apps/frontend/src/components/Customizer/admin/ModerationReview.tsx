'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertTriangle, Clock, User } from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface ModerationItem {
  id: string;
  designId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  previewUrl: string;
  reason: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  flaggedAt: string;
  flaggedBy?: 'auto' | 'user';
  detectionMethod: string;
}

interface ModerationReviewProps {
  item: ModerationItem;
  customizerId: string;
  onClose: () => void;
}

interface ModerationHistory {
  id: string;
  action: 'approved' | 'rejected' | 'escalated';
  reason?: string;
  notes?: string;
  moderatorId: string;
  moderatorName: string;
  createdAt: string;
}

export function ModerationReview({ item, customizerId, onClose }: ModerationReviewProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [history, setHistory] = useState<ModerationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await api.post(`/api/v1/customizer/configurations/${customizerId}/moderation/${item.id}/approve`, {
        notes,
      });
      onClose();
    } catch (err) {
      logger.error('Failed to approve', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setIsLoading(true);
    try {
      await api.post(`/api/v1/customizer/configurations/${customizerId}/moderation/${item.id}/reject`, {
        reason: rejectionReason,
        notes,
      });
      onClose();
    } catch (err) {
      logger.error('Failed to reject', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    setIsLoading(true);
    try {
      await api.post(`/api/v1/customizer/configurations/${customizerId}/moderation/${item.id}/escalate`, {
        notes,
      });
      onClose();
    } catch (err) {
      logger.error('Failed to escalate', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Moderation Review</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Left: Design Preview */}
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Design Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg overflow-hidden">
                  <img
                    src={item.previewUrl}
                    alt="Design preview"
                    className="w-full h-auto"
                  />
                </div>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900 dark:text-yellow-100">
                        Flagged Content
                      </div>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        {item.reason}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detection Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <Badge>{item.detectionMethod}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{(item.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flagged By:</span>
                  <Badge variant="outline">{item.flaggedBy || 'auto'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{new Date(item.flaggedAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: User Info & Actions */}
          <div className="w-80 space-y-4">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {item.userAvatar && <img src={item.userAvatar} alt={item.userName} />}
                    <AvatarFallback>
                      {item.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{item.userName}</div>
                    <div className="text-sm text-muted-foreground">{item.userEmail}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Rejection Reason */}
            {item.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Required if rejecting..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {item.status === 'pending' && (
                <>
                  <Button
                    className="w-full"
                    onClick={handleApprove}
                    disabled={isLoading}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleReject}
                    disabled={isLoading || !rejectionReason.trim()}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleEscalate}
                    disabled={isLoading}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Escalate
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* History */}
            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {history.map((entry) => (
                        <div key={entry.id} className="text-sm border-l-2 pl-3 py-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                entry.action === 'approved'
                                  ? 'default'
                                  : entry.action === 'rejected'
                                    ? 'destructive'
                                    : 'outline'
                              }
                            >
                              {entry.action}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="text-muted-foreground mt-1">{entry.reason}</div>
                          )}
                          {entry.notes && (
                            <div className="text-muted-foreground mt-1 text-xs">
                              {entry.notes}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            by {entry.moderatorName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
