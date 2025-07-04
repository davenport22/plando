
"use client";

import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect } from 'react';

export default function EditProfilePage() {
  const { user, userProfile, loading, isNewUser } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !userProfile) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/profile" passHref>
          <Button variant="outline" disabled={isNewUser === true}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
      </div>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">
            {isNewUser ? 'Welcome! Complete Your Profile' : 'Edit Your Profile'}
          </CardTitle>
          <CardDescription className="text-lg">
            {isNewUser
              ? 'Tell us a bit about yourself to get started.'
              : 'Make changes to your personal information and travel preferences.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNewUser === false && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertTitle>You're all set!</AlertTitle>
              <AlertDescription>
                Your profile is complete. Feel free to make any changes you'd like.
              </AlertDescription>
            </Alert>
          )}
          <ProfileEditForm initialData={userProfile} />
        </CardContent>
      </Card>
    </div>
  );
}
