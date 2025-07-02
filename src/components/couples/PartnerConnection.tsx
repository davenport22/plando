
"use client";

import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserPlus, LogOut } from 'lucide-react';
import Link from 'next/link';

interface PartnerConnectionProps {
    connectedPartner: UserProfile | null;
    isConnecting: boolean;
    partnerEmailInput: string;
    setPartnerEmailInput: (value: string) => void;
    handleConnectPartner: () => void;
    handleDisconnectPartner: () => void;
}

export function PartnerConnection({
    connectedPartner,
    isConnecting,
    partnerEmailInput,
    setPartnerEmailInput,
    handleConnectPartner,
    handleDisconnectPartner,
}: PartnerConnectionProps) {
    if (connectedPartner) {
        return (
            <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-3">Connected with:</h3>
                <Link href={`/users/${connectedPartner.id}`} passHref className="block hover:bg-accent/20 p-2 rounded-md transition-colors -m-2">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                            <AvatarImage src={connectedPartner.avatarUrl || `https://avatar.vercel.sh/${connectedPartner.email}.png`} alt={connectedPartner.name} />
                            <AvatarFallback>{connectedPartner.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary">{connectedPartner.name}</p>
                            <p className="text-sm text-muted-foreground">{connectedPartner.email}</p>
                        </div>
                    </div>
                </Link>
                <Button onClick={handleDisconnectPartner} variant="outline" size="sm" className="w-full mt-1">
                    <LogOut className="mr-2 h-4 w-4" /> Disconnect Partner
                </Button>
            </div>
        );
    }

    return (
        <>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connect with Your Partner</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <Input
                    type="email"
                    placeholder="Partner's email address"
                    value={partnerEmailInput}
                    onChange={(e) => setPartnerEmailInput(e.target.value)}
                    disabled={isConnecting}
                    className="flex-grow"
                />
                <Button onClick={handleConnectPartner} disabled={isConnecting || !partnerEmailInput.trim()} className="sm:w-auto">
                    {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Connect
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Enter your partner's Plando email to link accounts.</p>
        </>
    );
}
