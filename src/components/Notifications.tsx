import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useSession } from '../hooks/useSession';

export function Notifications() {
    const { user } = useSession();
    const [message, setMessage] = useState<string | null>(null);
    const timerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!user) return;
        const source = new EventSource('/api/users/me/notifications');
        source.onmessage = ({ data }) => {
            const event = JSON.parse(data);
            if (event.type === 'friend-request') {
                setMessage(`Новая заявка в друзья от ${event.fromName}`);
            } else if (event.type === 'friend-accepted') {
                setMessage(`${event.fromName} принял вашу заявку в друзья`);
            } else {
                return;
            }
            window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => setMessage(null), 6000);
        };
        return () => {
            source.close();
            window.clearTimeout(timerRef.current);
        };
    }, [user]);

    if (!message) return null;

    return (
        <Link
            to="/account"
            onClick={() => setMessage(null)}
            className="fixed top-20 right-4 z-[60] max-w-xs bg-surface border border-primary/40 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 hover:bg-white/10 transition-colors"
        >
            <UserPlus size={18} className="text-primary shrink-0" />
            <span className="text-sm">{message}</span>
        </Link>
    );
}
