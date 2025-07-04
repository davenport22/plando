
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
import { LayoutGrid, Grid } from 'lucide-react'; 
import { usePathname } from 'next/navigation';
import { plandoModules, getModuleByPath } from '@/config/plandoModules';
import { useEffect, useState } from 'react';
import type { PlandoModuleConfig } from '@/config/plandoModules';

const AppHeader = () => {
  const pathname = usePathname();
  const [currentModule, setCurrentModule] = useState<PlandoModuleConfig>(getModuleByPath(pathname));

  useEffect(() => {
    setCurrentModule(getModuleByPath(pathname));
  }, [pathname]);
  
  const isAuthPage = pathname === '/' || pathname === '/register';
  
  const showMyTripsButton = currentModule.id === 'travel' && !currentModule.isGlobal && !isAuthPage;

  let displayModuleName = currentModule.displayName; 
  let displayModuleIcon = currentModule.Icon;
  let displayBasePath = currentModule.path;

  // On authentication pages, show a generic "Plando" logo that links to the root.
  if (isAuthPage) {
    displayModuleName = 'Plando';
    displayModuleIcon = Grid; // Using Grid as a neutral "suite" icon
    displayBasePath = '/';
  } else if (currentModule.isGlobal) {
     // For /users/[userId], the base path is /users, but clicking logo should ideally go to a sensible default or stay.
     // For simplicity, let's keep displayBasePath as currentModule.path for global modules.
     // This means clicking "My Profile" logo on /profile/edit will go to /profile.
     // Clicking "User Profile" logo on /users/some-id will link to /users (which might not be a page, consider this UX).
     // For now, it links to currentModule.path.
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo moduleName={displayModuleName} ModuleIcon={displayModuleIcon} basePath={displayBasePath} />
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
                {plandoModules.filter(m => !m.isGlobal).map((module) => (
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
              <Link href="/trips" passHref> 
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
