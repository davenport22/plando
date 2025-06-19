
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getModuleByPath, plandoModules } from '@/config/plandoModules';

const ThemeApplicator = () => {
  const pathname = usePathname();

  useEffect(() => {
    const currentModule = getModuleByPath(pathname);
    const root = document.documentElement;

    // Remove all theme classes
    plandoModules.forEach(module => {
      if (module.themeClass) {
        root.classList.remove(module.themeClass);
      }
    });

    // Add current module's theme class
    if (currentModule && currentModule.themeClass) {
       // Only add if it's not the default "travel" theme, 
       // as travel theme is applied by :root in globals.css
      if (currentModule.id !== 'travel') {
        root.classList.add(currentModule.themeClass);
      }
    }
    
  }, [pathname]);

  return null; // This component does not render anything
};

export default ThemeApplicator;

    