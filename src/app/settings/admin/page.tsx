
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearLocalActivities, clearAllTrips } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash2, ShieldCheck, User, LogOut, Map, Globe } from 'lucide-react';
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
import { CitySelect } from "@/components/common/CitySelect";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AdminSettingsPage() {
  const { isAdmin, loading, logout, userProfile } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cityToClear, setCityToClear] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  const handleClearLocalActivities = async (city?: string) => {
    setIsProcessing(true);
    const result = await clearLocalActivities(city);
    setIsProcessing(false);

    if (result.success) {
      toast({
        title: "Local Activities Cleared!",
        description: `Removed ${result.deletedCount} documents for ${city ? `"${city}"` : 'all cities'}.`,
      });
      setCityToClear('');
    } else {
      toast({
        title: "Error Clearing Data",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleClearAllTrips = async () => {
    setIsProcessing(true);
    const result = await clearAllTrips();
    setIsProcessing(false);
    
    if (result.success) {
      toast({
        title: "All Trips Cleared!",
        description: `Removed ${result.deletedCount} trips and their related data.`,
      });
    } else {
       toast({
        title: "Error Clearing Trips",
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
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <header className="mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-headline font-bold text-primary flex items-center gap-3">
                    <ShieldCheck className="h-10 w-10" />
                    Admin Panel
                </h1>
                <p className="text-lg text-muted-foreground">App management and data clearing tools.</p>
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

      <div className="space-y-8">
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Trash2 className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl font-headline">Clear Local Discovery Data</CardTitle>
                </div>
                <CardDescription>
                    Use these tools to clear activities from the Couples, Friends, and Meet modules.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg space-y-4">
                    <Label htmlFor="city-to-clear" className="font-semibold text-base">Clear by Specific City</Label>
                    <div className="flex items-center gap-2">
                        <div className="flex-grow">
                          <CitySelect
                              onValueChange={setCityToClear}
                              defaultValue={cityToClear}
                          />
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={!cityToClear.trim()}>
                                <Map className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all local discovery activities for <strong>{`"${cityToClear}"`}</strong>. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleClearLocalActivities(cityToClear)} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, clear this city's data"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h3 className="font-semibold text-base">Clear All Local Activities</h3>
                        <p className="text-sm text-muted-foreground">
                            This will delete all Couples, Friends, and Meet activities for all cities.
                        </p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="bg-red-700 hover:bg-red-800">
                                <Globe className="mr-2 h-4 w-4" />
                                Clear All
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete ALL local discovery activities from the database. User profiles and trip data will NOT be affected.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClearLocalActivities()} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, clear all local activities"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                </div>
            </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-2xl font-headline text-destructive">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">Clear All Trip Data</h3>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all trips, itineraries, and trip activities. User profiles will remain.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Trips
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ALL trip and related itinerary data from your database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllTrips} disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        "Yes, delete all trips"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
