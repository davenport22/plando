
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { MOCK_USER_PROFILE } from '@/types'; // Changed from MOCK_USER to MOCK_USER_PROFILE
import { useState, useEffect } from 'react'; // Added

export function UserNav() {
  // In a real app, fetch user data or get from auth context
  const user = MOCK_USER_PROFILE; // Using MOCK_USER_PROFILE

  const [fallbackInitial, setFallbackInitial] = useState<string>(''); // Initialize with empty string for SSR

  useEffect(() => {
    // This effect runs only on the client, after the initial render
    if (user && user.name) {
      setFallbackInitial(user.name.charAt(0).toUpperCase());
    } else if (user && user.email) { // Fallback if name is somehow missing
      setFallbackInitial(user.email.charAt(0).toUpperCase());
    } else {
      setFallbackInitial("U"); // A generic fallback
    }
    // Since MOCK_USER_PROFILE is a static import, its identity is stable.
    // If 'user' came from props or a context that could change, user would be in dependency array.
  }, [user]);


  if (!user) {
    // This block is effectively unreachable with MOCK_USER_PROFILE as a constant
    // but good practice for a real app where user might be null.
    return (
      <Link href="/login">
        <Button variant="outline">Login</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary">
            {/* Use avatarUrl from MOCK_USER_PROFILE if available, otherwise fallback to vercel avatar */}
            <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{fallbackInitial}</AvatarFallback> {/* Use state for fallback */}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings"> {/* Assuming a settings page */}
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert('Logout clicked! Implement actual logout.')}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
