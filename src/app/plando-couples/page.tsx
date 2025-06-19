
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export default function PlandoCouplesPage() {
  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Heart className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Plando Couples</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-muted-foreground">
            Welcome to Plando Couples! Plan your romantic getaways and special trips together.
          </p>
          <p className="text-md text-muted-foreground mt-2">
            (This feature is currently under construction.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
