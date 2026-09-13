import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { SessionUser } from '../types';

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.session().then(({ user: sessionUser }) => setUser(sessionUser)).finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
