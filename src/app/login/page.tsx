import { LoginForm } from "@/components/auth/LoginForm";
import Logo from "@/components/common/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Log in to PlanGenie to access your trips.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
