
"use client";

import { useState } from 'react';
import type { Trip, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { addParticipantToTrip, removeParticipantFromTrip, resendInvitation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Loader2, UserPlus, Crown, Mail, Send } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';

interface ParticipantManagerProps {
  trip: Trip;
}

export function ParticipantManager({ trip }: ParticipantManagerProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !userProfile) return;

    setIsAdding(true);
    const result = await addParticipantToTrip(trip.id, email, userProfile.name);
    setIsAdding(false);

    if (result.success && result.message) {
      toast({ title: 'Success!', description: result.message });
      setEmail('');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    setRemovingId(participantId);
    const result = await removeParticipantFromTrip(trip.id, participantId);
    setRemovingId(null);

    if (result.success) {
      // Check if the current user removed themselves
      if (participantId === userProfile?.id) {
        toast({ title: 'You have left the trip', description: `You have been removed from "${trip.name}".` });
        router.push('/trips');
      } else {
        toast({ title: 'Participant Removed', description: 'The user has been removed from the trip.' });
      }
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleResendInvite = async (recipientEmail: string) => {
    if (!userProfile) {
      toast({ title: 'Error', description: 'You must be logged in to resend invitations.', variant: 'destructive'});
      return;
    }
    setResendingEmail(recipientEmail);
    const result = await resendInvitation(trip.id, recipientEmail, userProfile.name);
    setResendingEmail(null);

    if (result.success) {
      toast({ title: 'Invitation Resent!', description: `A new invitation has been sent to ${recipientEmail}.` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const hasPendingInvites = trip.invitedEmails && trip.invitedEmails.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Participants</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Manage who is going on this trip with you.
        </p>
        <div className="space-y-2">
          {trip.participants?.map((p: UserProfile) => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.avatarUrl} alt={p.name} />
                  <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    {p.name}
                    {p.id === trip.ownerId && <Crown className="h-4 w-4 text-amber-500" title="Trip Owner" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
              </div>
              {p.id !== trip.ownerId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveParticipant(p.id)}
                  disabled={removingId === p.id}
                  aria-label={`Remove ${p.name}`}
                >
                  {removingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {hasPendingInvites && (
        <div>
          <Label className="text-base font-semibold">Pending Invitations</Label>
           <p className="text-sm text-muted-foreground mb-3">
            These people have been invited but have not yet created an account.
          </p>
           <div className="space-y-2">
            {trip.invitedEmails?.map(invitedEmail => (
              <div key={invitedEmail} className="p-2 rounded-md bg-muted/50 opacity-80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 bg-muted-foreground/20">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                    </Avatar>
                    <p className="text-sm text-muted-foreground italic">{invitedEmail}</p>
                    </div>
                </div>
                 <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleResendInvite(invitedEmail)}
                  disabled={resendingEmail === invitedEmail}
                >
                  {resendingEmail === invitedEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Resend Invitation
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <form onSubmit={handleAddParticipant} className="space-y-2">
        <Label htmlFor="participant-email" className="font-semibold">Add or Invite Participant</Label>
        <div className="flex items-center gap-2">
          <Input
            id="participant-email"
            type="email"
            placeholder="Enter user's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAdding}
          />
          <Button type="submit" disabled={isAdding || !email.trim() || !userProfile}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Add</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground pt-1">If the user isn't on Plando, we'll send them an invitation.</p>
      </form>
    </div>
  );
}
