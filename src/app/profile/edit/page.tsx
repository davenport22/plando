import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserProfile } from '@/lib/actions';
import { MOCK_USER_PROFILE } from '@/types';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function EditProfilePage() {
  const userId = MOCK_USER_PROFILE.id; // This would come from auth in a real app
  const user = await getUserProfile(userId);

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="mb-6">
          <Link href="/profile" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            Could not load your profile for editing. Please check your backend
            configuration and try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/profile" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
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
          <ProfileEditForm initialData={user} />
        </CardContent>
      </Card>
    </div>
  );
}
