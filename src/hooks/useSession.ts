import { createContext, useContext } from 'react';
import type { SessionUser } from '../types';

export interface SessionContextValue {
    user: SessionUser | null;
    loading: boolean;
    refresh: () => Promise<void>;
    updateAvatar: (avatarUrl: string) => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within a SessionProvider');
    return context;
}
