
import { CheckSquare, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  moduleName?: string;
  ModuleIcon?: LucideIcon;
  basePath?: string;
}

const Logo = ({ moduleName = "Plando", ModuleIcon = CheckSquare, basePath = "/" }: LogoProps) => {
  return (
    <Link href={basePath} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
      <ModuleIcon className="h-8 w-8" />
      <span className="text-2xl font-headline font-semibold">{moduleName}</span>
    </Link>
  );
};

export default Logo;
