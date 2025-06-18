
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Info, Mail, LifeBuoy, UserCircle, Palette, ShieldAlert, Trash2, KeyRound, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast({ title: "Dark Mode Enabled" });
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast({ title: "Light Mode Enabled" });
    }
  };

  const handlePlaceholderAction = (actionName: string) => {
    toast({
      title: "Action Triggered",
      description: `${actionName} functionality is not yet implemented.`,
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-4xl font-headline font-bold text-primary">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your Plando preferences and account details.</p>
      </header>

      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">Preferences</CardTitle>
            </div>
            <CardDescription>Customize your Plando experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                <div>
                  <Label htmlFor="theme-switch" className="text-base font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
                </div>
              </div>
              <Switch 
                id="theme-switch" 
                aria-label="Toggle dark mode" 
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="language-select" className="text-base font-medium">Language</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred language.</p>
              </div>
              <Select defaultValue="en" onValueChange={(value) => handlePlaceholderAction(`Language set to ${value} (not implemented)`)}>
                <SelectTrigger id="language-select" className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español (Not implemented)</SelectItem>
                  <SelectItem value="fr">Français (Not implemented)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">Account Management</CardTitle>
            </div>
            <CardDescription>Manage your account settings and security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => handlePlaceholderAction("Change Password")}
            >
              <KeyRound className="h-5 w-5" /> Change Password
            </Button>
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2"
              onClick={() => handlePlaceholderAction("Delete Account")}
            >
              <Trash2 className="h-5 w-5" /> Delete Account
            </Button>
            <p className="text-xs text-muted-foreground px-1 pt-2">
              <ShieldAlert className="inline-block h-4 w-4 mr-1 relative -top-px" />
              Account management features require backend implementation.
            </p>
          </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">App Information</CardTitle>
            </div>
            <CardDescription>Details about the Plando application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">App Name:</strong> Plando</p>
            <p><strong className="text-foreground">Version:</strong> 1.0.0</p>
            <p><strong className="text-foreground">Description:</strong> Plando is your AI-powered collaborative trip planner, designed to make group travel easy and fun.</p>
          </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">Contact Us</CardTitle>
            </div>
            <CardDescription>Get in touch with the Plando team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Have questions or feedback? We&apos;d love to hear from you!
            </p>
            <Link href="mailto:support@plando.app" className="flex items-center gap-2 text-primary hover:underline">
              <Mail className="h-5 w-5" /> Email: support@plando.app
            </Link>
            <Button variant="link" className="p-0 h-auto flex items-center gap-2 text-primary hover:underline" onClick={(e) => {e.preventDefault(); handlePlaceholderAction("Navigate to FAQ");}}>
              <LifeBuoy className="h-5 w-5" /> Visit our FAQ
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
