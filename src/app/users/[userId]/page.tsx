
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, MapPinIcon, ArrowLeft, UserCircle, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { getUserProfile } from "@/lib/actions";
import { Alert } from "@/components/ui/alert";

interface UserProfileViewPageProps {
  params: {
    userId: string;
  };
}

export default async function UserProfileViewPage({ params }: UserProfileViewPageProps) {
  const { userId } = params;
  const viewedUser = await getUserProfile(userId);

  if (!viewedUser) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Link href="/" passHref>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Safety
          </Button>
        </Link>
        <Card className="text-center py-10">
          <CardHeader>
            <UserCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <CardDescription>
                The profile you are trying to view does not exist or could not be loaded.
              </CardDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
       <Link href="/plando-couples" passHref>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
       </Link>
      <Card className="mb-8 shadow-xl overflow-visible bg-card rounded-xl">
        <CardHeader className="text-center items-center pt-12 pb-6 bg-card relative rounded-t-xl">
          <Avatar className="w-32 h-32 border-4 border-primary shadow-lg -mt-16">
            <AvatarImage src={viewedUser.avatarUrl || `https://avatar.vercel.sh/${viewedUser.email}.png`} alt={viewedUser.name} />
            <AvatarFallback>{viewedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold mt-4 font-headline text-foreground">{viewedUser.name}</CardTitle>
          <CardDescription className="text-muted-foreground">{viewedUser.email}</CardDescription>
          {viewedUser.bio && <p className="text-foreground mt-2 text-center max-w-md">{viewedUser.bio}</p>}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {viewedUser.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="mr-3 h-5 w-5 text-primary" />
                <span>{viewedUser.location}</span>
              </div>
            )}
            {viewedUser.memberSince && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                <span>Member since {viewedUser.memberSince}</span>
              </div>
            )}
          </div>
          
          {viewedUser.interests && viewedUser.interests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {viewedUser.interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-sm px-3 py-1 hover:bg-accent hover:text-accent-foreground cursor-default">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
