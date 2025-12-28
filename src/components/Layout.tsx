import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background text-text flex flex-col items-center">
            <Navbar />
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
}
