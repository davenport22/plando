
"use client";

import type { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { ConnectionManager } from '@/components/common/ConnectionManager';

interface PartnerConnectionProps {
    currentUser: UserProfile | null;
    connectedPartner: UserProfile | null;
    handleDisconnectPartner: () => void;
    onConnectionChanged: () => void;
}

export function PartnerConnection({
    currentUser,
    connectedPartner,
    handleDisconnectPartner,
    onConnectionChanged
}: PartnerConnectionProps) {
    if (connectedPartner) {
        return (
            <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground mb-3">Connected with:</h3>
                <Link href={`/users/${connectedPartner.id}`} passHref className="block hover:bg-accent/20 p-2 rounded-md transition-colors -m-2 group">
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
        <ConnectionManager 
            connectionType="partner"
            currentUser={currentUser}
            onConnectionChanged={onConnectionChanged}
        />
    );
}
