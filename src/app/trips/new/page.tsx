import { NewTripForm } from '@/components/trips/NewTripForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewTripPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-primary">Plan Your Next Adventure</CardTitle>
            <CardDescription className="text-lg">
              Fill in the details below to start planning your new trip with Plando.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewTripForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
