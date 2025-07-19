

import { PlaneTakeoff, Users, Sparkles, Heart, Settings, User as UserIcon, type LucideIcon, CheckSquare } from 'lucide-react';

export interface PlandoThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Chart colors will be derived from primary, secondary, accent
}

export interface PlandoModuleConfig {
  id: string;
  name: string;
  displayName: string; // e.g., "Travel", "Friends"
  path: string;
  Icon: LucideIcon;
  themeClass?: string; // Optional: not all modules need a specific theme class if they use default
  light?: PlandoThemeColors; // Optional: only for modules with distinct themes
  dark?: PlandoThemeColors; // Optional: only for modules with distinct themes
  isGlobal?: boolean; // Indicates if it's a global page like Profile/Settings
  disabled?: boolean;
}

const defaultTravelThemeLight: PlandoThemeColors = { 
  background: "208 100% 97%",
  foreground: "208 50% 30%",
  card: "0 0% 100%",
  cardForeground: "208 50% 30%",
  popover: "0 0% 100%",
  popoverForeground: "208 50% 30%",
  primary: "197 71% 73%",
  primaryForeground: "0 0% 100%",
  secondary: "197 70% 83%",
  secondaryForeground: "197 50% 25%",
  muted: "208 70% 94%",
  mutedForeground: "208 40% 50%",
  accent: "180 65% 81%",
  accentForeground: "180 50% 25%",
  destructive: "0 84.2% 60.2%",
  destructiveForeground: "0 0% 98%",
  border: "208 60% 90%",
  input: "0 0% 100%",
  ring: "197 71% 68%",
};

const defaultTravelThemeDark: PlandoThemeColors = { 
  background: "208 30% 10%",
  foreground: "208 80% 90%",
  card: "208 30% 15%",
  cardForeground: "208 80% 90%",
  popover: "208 30% 15%",
  popoverForeground: "208 80% 90%",
  primary: "197 71% 78%",
  primaryForeground: "197 100% 10%",
  secondary: "197 70% 60%",
  secondaryForeground: "208 80% 90%",
  muted: "208 30% 20%",
  mutedForeground: "208 60% 70%",
  accent: "180 60% 51%",
  accentForeground: "180 80% 90%",
  destructive: "0 70% 50%",
  destructiveForeground: "0 0% 98%",
  border: "208 30% 25%",
  input: "208 30% 20%",
  ring: "197 71% 73%",
};


export const plandoModules: PlandoModuleConfig[] = [
  {
    id: 'travel',
    name: 'Plando Travel',
    displayName: 'Travel',
    path: '/trips',
    Icon: PlaneTakeoff,
    themeClass: 'theme-plando-travel', // This is the default theme in globals.css via :root
    light: defaultTravelThemeLight,
    dark: defaultTravelThemeDark,
  },
  {
    id: 'friends',
    name: 'Plando Friends',
    displayName: 'Friends',
    path: '/plando-friends',
    Icon: Users,
    themeClass: 'theme-plando-friends',
    disabled: false,
    light: {
      background: "140 65% 96%", 
      foreground: "140 35% 25%", 
      card: "0 0% 100%",
      cardForeground: "140 35% 25%",
      popover: "0 0% 100%",
      popoverForeground: "140 35% 25%",
      primary: "150 55% 70%",    
      primaryForeground: "150 60% 15%", 
      secondary: "150 50% 80%", 
      secondaryForeground: "150 40% 20%",
      muted: "140 60% 93%",
      mutedForeground: "140 30% 45%",
      accent: "160 60% 75%",     
      accentForeground: "160 50% 20%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "150 50% 85%",
      input: "0 0% 100%",
      ring: "150 55% 65%",
    },
    dark: {
      background: "140 25% 10%", 
      foreground: "140 60% 88%", 
      card: "140 25% 15%",
      cardForeground: "140 60% 88%",
      popover: "140 25% 15%",
      popoverForeground: "140 60% 88%",
      primary: "150 50% 65%",    
      primaryForeground: "150 90% 90%", 
      secondary: "150 45% 50%",
      secondaryForeground: "140 60% 88%",
      muted: "140 25% 20%",
      mutedForeground: "140 50% 65%",
      accent: "160 55% 55%",     
      accentForeground: "160 80% 85%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 98%",
      border: "150 25% 25%",
      input: "140 25% 20%",
      ring: "150 50% 60%",
    }
  },
  {
    id: 'meet',
    name: 'Plando Meet',
    displayName: 'Meet',
    path: '/plando-meet',
    Icon: Sparkles,
    themeClass: 'theme-plando-meet',
    disabled: true,
    light: {
      background: "35 100% 96%", 
      foreground: "30 50% 30%",  
      card: "0 0% 100%",
      cardForeground: "30 50% 30%",
      popover: "0 0% 100%",
      popoverForeground: "30 50% 30%",
      primary: "40 85% 75%",    
      primaryForeground: "40 70% 15%",  
      secondary: "40 80% 85%", 
      secondaryForeground: "40 50% 25%",
      muted: "35 90% 93%",
      mutedForeground: "35 40% 50%",
      accent: "30 90% 80%",     
      accentForeground: "30 60% 20%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "40 70% 88%",
      input: "0 0% 100%",
      ring: "40 85% 70%",
    },
    dark: {
      background: "35 30% 10%",  
      foreground: "35 70% 88%",  
      card: "35 30% 15%",
      cardForeground: "35 70% 88%",
      popover: "35 30% 15%",
      popoverForeground: "35 70% 88%",
      primary: "40 70% 70%",    
      primaryForeground: "40 100% 15%", 
      secondary: "40 65% 55%",
      secondaryForeground: "35 70% 88%",
      muted: "35 30% 20%",
      mutedForeground: "35 60% 68%",
      accent: "30 75% 60%",     
      accentForeground: "30 90% 85%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 98%",
      border: "40 30% 25%",
      input: "35 30% 20%",
      ring: "40 70% 65%",
    }
  },
  {
    id: 'couples',
    name: 'Plando Couples',
    displayName: 'Couples',
    path: '/plando-couples',
    Icon: Heart,
    themeClass: 'theme-plando-couples',
    light: {
      background: "330 100% 97%",
      foreground: "330 50% 35%", 
      card: "0 0% 100%",
      cardForeground: "330 50% 35%",
      popover: "0 0% 100%",
      popoverForeground: "330 50% 35%",
      primary: "320 70% 80%",   
      primaryForeground: "320 60% 20%", 
      secondary: "320 65% 88%",
      secondaryForeground: "320 45% 30%",
      muted: "330 80% 94%",
      mutedForeground: "330 40% 55%",
      accent: "300 75% 85%",    
      accentForeground: "300 55% 25%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "320 60% 90%",
      input: "0 0% 100%",
      ring: "320 70% 75%",
    },
    dark: {
      background: "330 30% 10%", 
      foreground: "330 70% 88%", 
      card: "330 30% 15%",
      cardForeground: "330 70% 88%",
      popover: "330 30% 15%",
      popoverForeground: "330 70% 88%",
      primary: "320 60% 75%",   
      primaryForeground: "320 100% 15%",
      secondary: "320 55% 60%",
      secondaryForeground: "330 70% 88%",
      muted: "330 30% 20%",
      mutedForeground: "330 60% 65%",
      accent: "300 65% 65%",    
      accentForeground: "300 85% 88%",
      destructive: "0 70% 50%",
      destructiveForeground: "0 0% 98%",
      border: "320 30% 25%",
      input: "330 30% 20%",
      ring: "320 60% 70%",
    }
  },
  // Global Pages (use default Plando Travel theme)
  {
    id: 'profile',
    name: 'My Profile', // Name for display in header
    displayName: 'My Profile',
    path: '/profile',
    Icon: UserIcon,
    isGlobal: true,
    // themeClass: 'theme-plando-travel', // Uses default
    light: defaultTravelThemeLight,
    dark: defaultTravelThemeDark,
  },
  {
    id: 'settings',
    name: 'Settings', // Name for display in header
    displayName: 'Settings',
    path: '/settings',
    Icon: Settings,
    isGlobal: true,
    // themeClass: 'theme-plando-travel', // Uses default
    light: defaultTravelThemeLight,
    dark: defaultTravelThemeDark,
  },
  {
    id: 'userProfileView',
    name: 'User Profile', // Generic name for viewing other users
    displayName: 'User Profile',
    path: '/users', // Base path for matching /users/[userId]
    Icon: UserIcon,
    isGlobal: true,
    // themeClass: 'theme-plando-travel', // Uses default
    light: defaultTravelThemeLight,
    dark: defaultTravelThemeDark,
  }
];

export const getModuleByPath = (pathname: string): PlandoModuleConfig => {
  const defaultModule = plandoModules.find(m => m.id === 'travel')!;

  if (pathname === '/modules') {
    return {
        id: 'home',
        name: 'Plando',
        displayName: 'Plando',
        path: '/modules',
        Icon: CheckSquare,
        isGlobal: true,
        themeClass: 'theme-plando-travel',
    };
  }

  // Exact matches first
  const exactMatch = plandoModules.find(module => module.path === pathname && module.path !== '/');
  if (exactMatch) {
    return exactMatch;
  }

  // Check for global page prefixes like /profile, /settings, /users/
  const globalModuleMatch = plandoModules.find(module => 
    module.isGlobal && module.path !== '/' && pathname.startsWith(module.path)
  );
  if (globalModuleMatch) {
    return globalModuleMatch;
  }
  
  // Check for other module prefixes (excluding global ones already checked and root)
  const prefixMatch = plandoModules
    .filter(module => !module.isGlobal && module.path !== '/')
    .sort((a, b) => b.path.length - a.path.length) // Sort by path length to match more specific paths first
    .find(module => pathname.startsWith(module.path));

  if (prefixMatch) {
    return prefixMatch;
  }
  
  // If on root path "/", return the travel module
  if (pathname === '/') {
    return defaultModule;
  }

  // Fallback to default (travel) for any other unmatched paths (e.g. /trips/new, /trips/[id])
  return defaultModule;
};
