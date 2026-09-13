import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { SessionUser } from '../types';
import { SessionContext } from '../hooks/useSession';

export function SessionProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(
        () => api.session().then(({ user: sessionUser }) => setUser(sessionUser)).finally(() => setLoading(false)),
        [],
    );

    const updateAvatar = useCallback((avatarUrl: string) => {
        setUser((prev) => (prev ? { ...prev, avatarUrl } : prev));
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return (
        <SessionContext.Provider value={{ user, loading, refresh, updateAvatar }}>
            {children}
        </SessionContext.Provider>
    );
}
