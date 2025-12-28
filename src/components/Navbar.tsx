import { Link, useLocation } from 'react-router-dom';
import { User, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { CURRENT_USER } from '../mocks/data';
import logoBig from '../icons/logoBig.svg';

export function Navbar() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="sticky top-0 w-full h-16 bg-surface/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-center px-6">
            <div className="w-full flex items-center justify-between">
                <Link to="/account" className={cn("p-2 rounded-full transition-all", isActive('/account') ? "text-primary bg-white/10" : "text-subtext hover:text-text")}>
                    <div className="relative">
                        <User size={24} />
                        <img src={CURRENT_USER.avatarUrl} alt="User" className="absolute top-0 left-0 w-6 h-6 rounded-full opacity-0" />
                    </div>
                </Link>

                <Link to="/" className={cn("px-2 py-2 md:px-5 md:py-2 rounded-full transition-all scale-110 flex items-center justify-center", isActive('/') ? "text-primary shadow-[0_0_20px_rgba(229,9,20,0.5)] bg-white/5" : "text-subtext hover:text-primary")}>
                    <img src={logoBig} alt="Logo" className="hidden md:block h-7 w-auto" />
                    <img src="/logo.svg" alt="Logo" className="md:hidden w-8 h-8" />
                </Link>

                <Link to="/recommendations" className={cn("p-2 rounded-full transition-all", isActive('/recommendations') ? "text-primary bg-white/10" : "text-subtext hover:text-text")}>
                    <Sparkles size={24} />
                </Link>
            </div>
        </nav>
    );
}
