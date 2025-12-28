import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'outline';
}

export function Badge({ children, className, variant = 'primary' }: BadgeProps) {
    const variants = {
        primary: 'bg-primary text-white',
        secondary: 'bg-surface text-text',
        outline: 'border border-gray-600 text-subtext bg-transparent',
    };

    return (
        <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm",
            variants[variant],
            className
        )}>
            {children}
        </div>
    );
}
