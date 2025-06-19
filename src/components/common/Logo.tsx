import { PlaneTakeoff } from 'lucide-react';
import Link from 'next/link';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
      <PlaneTakeoff className="h-8 w-8" />
      <span className="text-2xl font-headline font-semibold">Plando Travel</span>
    </Link>
  );
};

export default Logo;
