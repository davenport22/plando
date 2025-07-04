"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This component handles the old "/login" path and safely redirects users to the new "/trips" page.
export default function LoginPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/trips');
  }, [router]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Redirecting to your trips...</p>
    </div>
  );
}
