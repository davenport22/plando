
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
import { LayoutGrid, Grid, User as UserIcon, Settings as SettingsIcon } from 'lucide-react'; 
import { usePathname } from 'next/navigation';
import { plandoModules, getModuleByPath } from '@/config/plandoModules';
import { useEffect, useState } from 'react';
import type { PlandoModuleConfig } from '@/config/plandoModules';

const AppHeader = () => {
  const pathname = usePathname();
  // For theming and underlying context, currentModule is determined by getModuleByPath.
  // For /profile or /settings, this will default to 'travel'.
  const [currentModule, setCurrentModule] = useState<PlandoModuleConfig>(getModuleByPath(pathname));

  useEffect(() => {
    setCurrentModule(getModuleByPath(pathname));
  }, [pathname]);
  
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProfilePage = pathname === '/profile' || pathname.startsWith('/profile/');
  const isSettingsPage = pathname === '/settings';
  
  // "My Trips" button shows if the module context is 'travel' (which is default for global pages)
  const showMyTripsButton = currentModule.id === 'travel' && !isAuthPage;

  // Determine display properties for the main logo
  let displayModuleName = currentModule.name;
  let displayModuleIcon = currentModule.Icon;
  let displayBasePath = currentModule.path;

  if (isProfilePage) {
    displayModuleName = "My Profile";
    displayModuleIcon = UserIcon; 
    displayBasePath = "/profile";
  } else if (isSettingsPage) {
    displayModuleName = "Settings";
    displayModuleIcon = SettingsIcon; 
    displayBasePath = "/settings";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo moduleName={displayModuleName} ModuleIcon={displayModuleIcon} basePath={displayBasePath} />
          {/* Plando Suite dropdown is available on non-auth pages */}
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
                  <DropdownMenuItem key={module.id} asChild data-active={module.id === currentModule.id}>
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
              <Link href="/" passHref> {/* Link "My Trips" to Plando Travel home */}
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
    