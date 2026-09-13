import React from 'react';
import { Navbar } from './Navbar';
import { Notifications } from './Notifications';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background text-text flex flex-col items-center">
            <Navbar />
            <Notifications />
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
}
