
"use client";

import { useState } from 'react';
import type { UserProfile, ConnectionRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Check, X, MailQuestion, Hourglass } from 'lucide-react';
import { sendFriendRequest, sendPartnerRequest, cancelConnectionRequest, respondToConnectionRequest } from '@/lib/actions';

interface ConnectionManagerProps {
  connectionType: 'partner' | 'friend';
  currentUser: UserProfile | null;
  onConnectionChanged: () => void;
}

export function ConnectionManager({ connectionType, currentUser, onConnectionChanged }: ConnectionManagerProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentUser) return;

    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      toast({ title: 'Oops!', description: "You can't send a request to yourself." });
      return;
    }

    setIsProcessing(true);
    const result = connectionType === 'partner'
      ? await sendPartnerRequest(currentUser.id, email)
      : await sendFriendRequest(currentUser.id, email);
    
    if (result.success) {
      toast({ title: 'Request Sent!', description: `Your ${connectionType} request has been sent to ${email}.` });
      setEmail('');
      onConnectionChanged();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsProcessing(false);
  };
  
  const handleCancelRequest = async (toUserId: string) => {
    if(!currentUser) return;
    setIsProcessing(true);
    const result = await cancelConnectionRequest(currentUser.id, toUserId, connectionType);
    if (result.success) {
        toast({ title: "Request Cancelled", description: `Your ${connectionType} request has been withdrawn.` });
        onConnectionChanged();
    } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsProcessing(false);
  }

  const handleResponse = async (fromUserId: string, response: 'accepted' | 'declined') => {
      if (!currentUser) return;
      setIsProcessing(true);
      const result = await respondToConnectionRequest(currentUser.id, fromUserId, response, connectionType);
      if (result.success) {
        toast({ title: `Request ${response}`, description: `You have ${response} the ${connectionType} request.` });
        onConnectionChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
      setIsProcessing(false);
  }

  const sentRequest = currentUser?.sentPartnerRequest;
  const incomingRequest = currentUser?.partnerRequest;

  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-semibold text-foreground mb-2">Connect with Your {connectionType === 'partner' ? 'Partner' : 'a Friend'}</h3>
      
      {connectionType === 'partner' && incomingRequest && (
        <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-800 dark:text-amber-200"><MailQuestion className="h-4 w-4"/> Incoming Request</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">You have a partner request from <strong>{incomingRequest.fromUserName}</strong> ({incomingRequest.fromUserEmail}).</p>
             <div className="flex items-center justify-end gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleResponse(incomingRequest.fromUserId, 'accepted')} disabled={isProcessing}><Check className="h-4 w-4 mr-1"/> Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => handleResponse(incomingRequest.fromUserId, 'declined')} disabled={isProcessing}><X className="h-4 w-4 mr-1"/> Decline</Button>
            </div>
        </div>
      )}

      {connectionType === 'partner' && sentRequest && (
        <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/30">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200"><Hourglass className="h-4 w-4"/> Request Sent</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">You sent a partner request to <strong>{sentRequest.fromUserEmail}</strong>. Waiting for them to respond.</p>
            <Button size="sm" variant="outline" onClick={() => handleCancelRequest(sentRequest.fromUserId)} disabled={isProcessing}>Cancel Request</Button>
        </div>
      )}
      
      {!(sentRequest || incomingRequest) && (
        <form onSubmit={handleSendRequest} className="flex flex-col sm:flex-row gap-2">
            <Input
                type="email"
                placeholder={connectionType === 'partner' ? "Partner's email" : "Friend's email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isProcessing}
                className="flex-grow"
            />
            <Button type="submit" disabled={isProcessing || !email.trim()} className="sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Send Request
            </Button>
        </form>
      )}

    </div>
  );
}
