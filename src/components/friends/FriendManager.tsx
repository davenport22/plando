
"use client";

import { useState } from 'react';
import type { UserProfile, ConnectionRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { disconnectFriend, setActiveFriend, cancelConnectionRequest, respondToConnectionRequest } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Loader2, UserPlus, CheckCircle2, Circle, Check, Hourglass, MailQuestion, UserMinus } from 'lucide-react';
import { ConnectionManager } from '@/components/common/ConnectionManager';

interface FriendManagerProps {
  currentUser: UserProfile | null;
  friends: UserProfile[];
  activeFriendId?: string | null;
  onConnectionChanged: () => void;
}

export function FriendManager({ currentUser, friends, activeFriendId, onConnectionChanged }: FriendManagerProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDisconnect = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    setIsProcessing(true);
    const result = await disconnectFriend(currentUser.id, friendId);
    if (result.success) {
      toast({ title: "Friend Removed", description: `You are no longer friends with ${friendName}.` });
      onConnectionChanged();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsProcessing(false);
  };
  
  const handleCancelRequest = async (toUserId: string) => {
    if(!currentUser) return;
    setIsProcessing(true);
    const result = await cancelConnectionRequest(currentUser.id, toUserId, 'friend');
    if (result.success) {
        toast({ title: "Request Cancelled", description: "Your friend request has been withdrawn." });
        onConnectionChanged();
    } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsProcessing(false);
  }

  const handleResponse = async (fromUserId: string, response: 'accepted' | 'declined') => {
      if (!currentUser) return;
      setIsProcessing(true);
      const result = await respondToConnectionRequest(currentUser.id, fromUserId, response, 'friend');
      if (result.success) {
        toast({ title: `Request ${response}`, description: `You have ${response} the friend request.` });
        onConnectionChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
      setIsProcessing(false);
  }

  const handleSetActive = async (friendId: string | null) => {
    if (!currentUser) return;
    setIsProcessing(true);
    const result = await setActiveFriend(currentUser.id, friendId);
    if (result.success) {
      const friendName = friends.find(f => f.id === friendId)?.name;
      toast({ title: 'Active Friend Updated', description: friendId ? `You are now swiping with ${friendName}.` : "Swiping deactivated." });
      onConnectionChanged();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsProcessing(false);
  };

  const incomingRequests = currentUser?.friendRequests?.filter(r => r.status === 'pending') || [];
  const sentRequests = currentUser?.sentFriendRequests?.filter(r => r.status === 'pending') || [];

  return (
    <div className="space-y-4 text-left">
      <ConnectionManager
        connectionType="friend"
        currentUser={currentUser}
        onConnectionChanged={onConnectionChanged}
      />
      
      {incomingRequests.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><MailQuestion className="h-4 w-4"/> Incoming Requests</h4>
            {incomingRequests.map(req => (
                <div key={req.fromUserId} className="flex items-center justify-between p-2 rounded-md bg-background/50 text-sm">
                    <span>{req.fromUserName}</span>
                    <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-600" onClick={() => handleResponse(req.fromUserId, 'accepted')} disabled={isProcessing}><Check className="h-5 w-5"/></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-600" onClick={() => handleResponse(req.fromUserId, 'declined')} disabled={isProcessing}><X className="h-5 w-5"/></Button>
                    </div>
                </div>
            ))}
          </div>
      )}

      {friends.length > 0 && (
        <div className="pt-2">
          <h3 className="font-semibold mb-2">My Friends</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">{friend.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleSetActive(activeFriendId === friend.id ? null : friend.id)} disabled={isProcessing} title={activeFriendId === friend.id ? "Deactivate for Swiping" : "Activate for Swiping"}>
                    {activeFriendId === friend.id ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Unfriend" onClick={() => handleDisconnect(friend.id, friend.name)} disabled={isProcessing}>
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Hourglass className="h-4 w-4" /> Sent Requests</h4>
            {sentRequests.map(req => (
                <div key={req.fromUserId} className="flex items-center justify-between p-2 rounded-md bg-background/50 text-sm text-muted-foreground">
                    <span>{req.fromUserEmail}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleCancelRequest(req.fromUserId)} disabled={isProcessing}>Cancel</Button>
                </div>
            ))}
          </div>
      )}
    </div>
  );
}
