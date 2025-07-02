
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
import { MOCK_USER_PROFILE } from '@/types'; 
import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const user = MOCK_USER_PROFILE; 
  const router = useRouter();
  const { toast } = useToast();

  const [fallbackInitial, setFallbackInitial] = useState<string>(''); 

  useEffect(() => {
    if (user && user.name) {
      setFallbackInitial(user.name.charAt(0).toUpperCase());
    } else if (user && user.email) { 
      setFallbackInitial(user.email.charAt(0).toUpperCase());
    } else {
      setFallbackInitial("U"); 
    }
  }, [user]);

  const handleLogout = () => {
    // In a real app, you would also clear any authentication tokens or session data.
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/');
  };


  if (!user) {
    return (
      <Link href="/">
        <Button variant="outline">Login</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
            <AvatarFallback>{fallbackInitial}</AvatarFallback> 
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
            <Link href="/settings"> 
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
