
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAllActivities } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash2, ShieldCheck, User, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminSettingsPage() {
  const { isAdmin, loading, logout, userProfile } = useAuth();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  const handleClearData = async () => {
    setIsClearing(true);
    const result = await clearAllActivities();
    setIsClearing(false);

    if (result.success) {
      toast({
        title: "Data Cleared Successfully!",
        description: `Removed ${result.deletedCount} documents from the database.`,
      });
    } else {
      toast({
        title: "Error Clearing Data",
        description: result.error,
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  }

  if (loading || !isAdmin) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <header className="mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-headline font-bold text-primary flex items-center gap-3">
                    <ShieldCheck className="h-10 w-10" />
                    Admin Panel
                </h1>
                <p className="text-lg text-muted-foreground">App management and one-time actions.</p>
            </div>
            <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2"/>Log Out</Button>
        </div>
      </header>

      <Alert className="mb-8 border-green-500/50 bg-green-500/10 text-green-700">
        <User className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Logged in as {userProfile?.name}</AlertTitle>
        <AlertDescription>
            You are currently in admin mode.
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl font-headline text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold text-lg">Clear All App Data</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all trips and all local activities. User profiles will remain.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete ALL trip and activity data from your database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} disabled={isClearing}>
                    {isClearing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      "Yes, delete all data"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
