
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { plandoModules } from "@/config/plandoModules";

export default function PlandoMeetPage() {
  const meetModule = plandoModules.find(m => m.id === 'meet');
  const Icon = meetModule?.Icon || Sparkles;

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Icon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">{meetModule?.name || "Plando Meet"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground">
            Welcome to Plando Meet! Discover new travel buddies and plan spontaneous adventures.
          </p>
          <p className="text-md text-muted-foreground mt-2">
            (This feature is currently under construction.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    