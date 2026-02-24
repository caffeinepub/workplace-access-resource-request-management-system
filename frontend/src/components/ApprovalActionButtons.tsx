import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useApproveRequest, useRejectRequest, useRequestMoreInfo } from '../hooks/useQueries';
import { toast } from 'sonner';

interface ApprovalActionButtonsProps {
  requestId: bigint;
  onActionComplete?: () => void;
}

type ActionType = 'approve' | 'reject' | 'moreInfo' | null;

export default function ApprovalActionButtons({ requestId, onActionComplete }: ApprovalActionButtonsProps) {
  const [action, setAction] = useState<ActionType>(null);
  const [comments, setComments] = useState('');

  const { mutateAsync: approve, isPending: approving } = useApproveRequest();
  const { mutateAsync: reject, isPending: rejecting } = useRejectRequest();
  const { mutateAsync: moreInfo, isPending: requestingInfo } = useRequestMoreInfo();

  const isPending = approving || rejecting || requestingInfo;

  const handleConfirm = async () => {
    try {
      const c = comments.trim() || null;
      if (action === 'approve') {
        await approve({ requestId, comments: c });
        toast.success('Request approved successfully');
      } else if (action === 'reject') {
        await reject({ requestId, comments: c });
        toast.success('Request rejected');
      } else if (action === 'moreInfo') {
        await moreInfo({ requestId, comments: c });
        toast.success('More information requested');
      }
      setAction(null);
      setComments('');
      onActionComplete?.();
    } catch {
      toast.error('Action failed. Please try again.');
    }
  };

  const actionConfig = {
    approve: { title: 'Approve Request', description: 'Add optional comments for the requester.', confirmLabel: 'Approve', variant: 'default' as const },
    reject: { title: 'Reject Request', description: 'Please provide a reason for rejection.', confirmLabel: 'Reject', variant: 'destructive' as const },
    moreInfo: { title: 'Request More Information', description: 'Specify what additional information is needed.', confirmLabel: 'Send Request', variant: 'default' as const },
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
          onClick={() => setAction('approve')}
        >
          <CheckCircle size={14} />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5"
          onClick={() => setAction('reject')}
        >
          <XCircle size={14} />
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setAction('moreInfo')}
        >
          <MessageSquare size={14} />
          More Info
        </Button>
      </div>

      <Dialog open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{action ? actionConfig[action].title : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{action ? actionConfig[action].description : ''}</p>
            <div className="space-y-1.5">
              <Label htmlFor="comments">Comments {action === 'reject' || action === 'moreInfo' ? '(required)' : '(optional)'}</Label>
              <Textarea
                id="comments"
                placeholder="Enter your comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button
              variant={action ? actionConfig[action].variant : 'default'}
              onClick={handleConfirm}
              disabled={isPending || ((action === 'reject' || action === 'moreInfo') && !comments.trim())}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : action ? actionConfig[action].confirmLabel : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
