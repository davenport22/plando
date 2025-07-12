
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAllActivities } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
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

export default function AdminSettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const handleClearData = async () => {
    setIsClearing(true);
    const result = await clearAllActivities();
    setIsClearing(false);

    if (result.success) {
      toast({
        title: "Data Cleared Successfully!",
        description: `Removed ${result.deletedCount} activities from the database.`,
      });
    } else {
      toast({
        title: "Error Clearing Data",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">Temporary Admin Panel</h1>
        <p className="text-lg text-muted-foreground">One-time actions for managing your app data.</p>
      </header>

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
              <h3 className="font-semibold text-lg">Clear All Activity Data</h3>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all activities from the 'couples', 'friends', and 'meet' modules.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all activity data from your database.
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
                      "Yes, delete all activities"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
       <div className="mt-6 text-center text-muted-foreground text-sm">
            <p>After you are done, please ask me to remove this page.</p>
        </div>
    </div>
  );
}
