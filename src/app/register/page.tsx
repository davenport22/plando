
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join Plando and start planning your next adventure.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <div className="p-6 pt-0 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?
            <Link href="/" className="ml-1 text-primary hover:underline font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
