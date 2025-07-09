
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { plandoModules } from '@/config/plandoModules';
import Link from 'next/link';

export default function ModulesPage() {
  const displayModules = plandoModules.filter(m => !m.isGlobal);

  const getModuleDescription = (id: string) => {
    switch (id) {
        case 'travel': return 'Collaboratively plan group trips with AI-powered suggestions.';
        case 'friends': return 'Discover and share fun activities to do with your friends.';
        case 'meet': return 'Find interesting things to do and meet new people around you.';
        case 'couples': return 'Discover and swipe on date ideas with your partner.';
        default: return 'An exciting Plando module.';
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Welcome to Plando</h1>
        <p className="text-xl text-muted-foreground mt-2">Your all-in-one planning suite. Choose a module to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {displayModules.map((module) => (
          <Link key={module.id} href={module.path} className="block group">
            <Card className="h-full flex flex-col items-center justify-center text-center p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <CardHeader className="p-0 mb-4 items-center">
                <div className="bg-primary/10 p-5 rounded-full w-fit mb-4 transition-colors duration-300 group-hover:bg-primary/20">
                     <module.Icon className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline text-primary group-hover:text-primary/80 transition-colors duration-300">
                   {module.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription>
                  {getModuleDescription(module.id)}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
