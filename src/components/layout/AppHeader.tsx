
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
import { LayoutGrid, Grid } from 'lucide-react'; // Removed unused icons, Grid is for dropdown trigger
import { usePathname } from 'next/navigation';
import { plandoModules, getModuleByPath } from '@/config/plandoModules';
import { useEffect, useState } from 'react';
import type { PlandoModuleConfig } from '@/config/plandoModules';

const AppHeader = () => {
  const pathname = usePathname();
  const [currentModule, setCurrentModule] = useState<PlandoModuleConfig>(plandoModules[0]); // Default to travel

  useEffect(() => {
    setCurrentModule(getModuleByPath(pathname));
  }, [pathname]);
  
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  // "My Trips" button is specific to Plando Travel
  const showMyTripsButton = currentModule.id === 'travel' && !isAuthPage;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo moduleName={currentModule.name} ModuleIcon={currentModule.Icon} basePath={currentModule.path} />
          {!isAuthPage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                  <Grid className="h-5 w-5" />
                  <span className="sr-only">Open Plando Apps</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Plando Suite</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {plandoModules.map((module) => (
                  <DropdownMenuItem key={module.id} asChild>
                    <Link href={module.path} className="flex items-center">
                      <module.Icon className="mr-2 h-4 w-4" />
                      <span>{module.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {!isAuthPage && (
          <nav className="flex items-center gap-2 sm:gap-4">
            {showMyTripsButton && (
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

    