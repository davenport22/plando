
"use client";

import { useState } from 'react';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { connectFriend, disconnectFriend, setActiveFriend } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Loader2, UserPlus, CheckCircle2, Circle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FriendManagerProps {
  currentUser: UserProfile | null;
  friends: UserProfile[];
  activeFriendId?: string | null;
  onFriendsChanged: () => void;
}

export function FriendManager({ currentUser, friends, activeFriendId, onFriendsChanged }: FriendManagerProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentUser) return;

    if(email.toLowerCase() === currentUser.email.toLowerCase()){
      toast({ title: 'Oops!', description: "You can't add yourself as a friend." });
      return;
    }

    setIsAdding(true);
    const result = await connectFriend(currentUser.id, email);
    setIsAdding(false);

    if (result.success && result.friend) {
      toast({ title: 'Friend Added!', description: `You are now friends with ${result.friend.name}.` });
      setEmail('');
      onFriendsChanged();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDisconnect = async (friendId: string) => {
      if (!currentUser) return;
      setIsProcessing(true);
      const result = await disconnectFriend(currentUser.id, friendId);
      if (result.success) {
        toast({ title: "Friend Removed", description: "The user has been removed from your friends list."});
        onFriendsChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive'});
      }
      setIsProcessing(false);
  }

  const handleSetActive = async (friendId: string | null) => {
    if (!currentUser) return;
    setIsProcessing(true);
    const result = await setActiveFriend(currentUser.id, friendId);
    if(result.success) {
        const friendName = friends.find(f => f.id === friendId)?.name;
        toast({ title: 'Active Friend Updated', description: friendId ? `You are now swiping with ${friendName}.` : "Swiping deactivated." });
        onFriendsChanged();
    } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive'});
    }
    setIsProcessing(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">My Friends</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {friends.length > 0 ? friends.map((friend) => (
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
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => handleSetActive(activeFriendId === friend.id ? null : friend.id)}
                    disabled={isProcessing}
                    title={activeFriendId === friend.id ? "Deactivate for Swiping" : "Activate for Swiping"}
                >
                    {activeFriendId === friend.id ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Unfriend">
                        <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove {friend.name} from your friends list. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDisconnect(friend.id)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, unfriend"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground text-center py-4">You haven't added any friends yet.</p>}
        </div>
      </div>
      <form onSubmit={handleAddFriend} className="space-y-2 pt-2 border-t">
        <label htmlFor="friend-email" className="text-sm font-medium">Add a Friend by Email</label>
        <div className="flex items-center gap-2">
          <Input
            id="friend-email"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAdding}
          />
          <Button type="submit" disabled={isAdding || !email.trim()}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
