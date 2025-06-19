
"use client";

import Logo from '@/components/common/Logo';
import { UserNav } from '@/components/auth/UserNav';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, Grid, Users, Sparkles, Heart, PlaneTakeoff } from 'lucide-react'; // Changed Apps to Grid
import { usePathname } from 'next/navigation';

const AppHeader = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  const isPlandoTravelSection = !isAuthPage && 
                                !pathname.startsWith('/plando-friends') &&
                                !pathname.startsWith('/plando-meet') &&
                                !pathname.startsWith('/plando-couples');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
          {!isAuthPage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Grid className="h-5 w-5" /> {/* Changed Apps to Grid */}
                  <span className="sr-only">Open Plando Apps</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Plando Suite</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <PlaneTakeoff className="mr-2 h-4 w-4" />
                    <span>Plando Travel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/plando-friends" className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Plando Friends</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/plando-meet" className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Plando Meet</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/plando-couples" className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Plando Couples</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {!isAuthPage && (
          <nav className="flex items-center gap-2 sm:gap-4">
            {isPlandoTravelSection && (
              <Link href="/" passHref>
                <Button variant="ghost">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  My Trips
                </Button>
              </Link>
            )}
            <UserNav />
          </nav>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
