
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MOCK_USER_PROFILE, type UserProfile } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  // In a real app, user data would be fetched or come from a global state/context
  const [user, setUser] = useState<UserProfile>(MOCK_USER_PROFILE);

  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    // Simulate API call to update profile
    console.log("Updating profile with:", updatedData);
    
    // In a real app, you'd update your backend here.
    // For mock purposes, we can update the MOCK_USER_PROFILE directly if we want changes
    // to persist across navigations (though this is not standard practice for constants).
    // Or, rely on a state management solution.
    // For this example, we'll just show a toast and redirect.
    // The main profile page will re-render with its own MOCK_USER_PROFILE state.
    
    // Update local state for the form if needed, though redirect happens quickly
    setUser(prevUser => ({ ...prevUser, ...updatedData }));

    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
    router.push('/profile');
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/profile" passHref>
          <Button variant="outline" asChild>
            <a>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </a>
          </Button>
        </Link>
      </div>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Edit Your Profile</CardTitle>
          <CardDescription className="text-lg">
            Make changes to your personal information and travel preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditForm initialData={user} onSubmit={handleSaveProfile} />
        </CardContent>
      </Card>
    </div>
  );
}
