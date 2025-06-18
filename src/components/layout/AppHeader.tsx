import Logo from '@/components/common/Logo';
import { UserNav } from '@/components/auth/UserNav';
import Link from 'next/link';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4">
           <Link href="/trips/new">
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Trip
            </Button>
          </Link>
          <UserNav />
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
