import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Copy, Check, Popcorn, Star } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Movie, RoomState } from '../types';

function Lobby() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    const create = async () => {
        setCreating(true);
        setError('');
        try {
            const room = await api.createRoom();
            navigate(`/room/${room.code}`);
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : 'Не удалось создать комнату');
            setCreating(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 pt-12 text-center">
            <Popcorn size={48} className="mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Кино-вечер на двоих</h1>
            <p className="text-subtext mb-8">Создайте комнату и поделитесь кодом с другом. Свайпайте вместе — при взаимном лайке будет мэтч.</p>
            <button onClick={create} disabled={creating} className="w-full py-4 bg-primary rounded-xl font-bold mb-6 disabled:opacity-50">
                {creating ? 'Создаём…' : 'Создать комнату'}
            </button>
            <div className="flex items-center gap-3 text-subtext text-sm mb-4"><div className="flex-1 h-px bg-white/10" />или<div className="flex-1 h-px bg-white/10" /></div>
            <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/room/${code.trim().toUpperCase()}`); }} className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Код комнаты" maxLength={6} className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-3 text-center tracking-widest font-mono" />
                <button type="submit" className="px-5 py-3 bg-surface border border-white/10 rounded-xl font-semibold hover:bg-white/10">Войти</button>
            </form>
            {error && <p className="text-primary mt-4">{error}</p>}
        </div>
    );
}

function RoomSession({ code }: { code: string }) {
    const [room, setRoom] = useState<RoomState | null>(null);
    const [error, setError] = useState('');
    const [deck, setDeck] = useState<Movie[]>([]);
    const [index, setIndex] = useState(0);
    const [toast, setToast] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const toastTimer = useRef<number | undefined>(undefined);

    useEffect(() => {
        api.joinRoom(code).then(setRoom).catch((caught) => setError(caught instanceof ApiError ? caught.message : 'Комната недоступна'));
        api.movies().then(({ data }) => setDeck(data)).catch(() => undefined);
    }, [code]);

    useEffect(() => {
        const source = new EventSource(`/api/rooms/${code}/events`);
        source.onmessage = ({ data }) => {
            const event = JSON.parse(data);
            if (event.type === 'match') {
                setRoom((prev) => (prev ? { ...prev, matches: [event.movie, ...prev.matches.filter((m: Movie) => m.id !== event.movie.id)] } : prev));
                setToast(`🍿 Мэтч! Вы оба хотите посмотреть «${event.movie.title}»`);
            } else if (event.type === 'joined') {
                setRoom((prev) => (prev ? { ...prev, guest: { id: event.userId, name: event.name }, ready: true } : prev));
                setToast(`${event.name} присоединился к комнате`);
            } else {
                return;
            }
            window.clearTimeout(toastTimer.current);
            toastTimer.current = window.setTimeout(() => setToast(null), 5000);
        };
        return () => { source.close(); window.clearTimeout(toastTimer.current); };
    }, [code]);

    const current = deck[index];

    const swipe = async (direction: 'like' | 'dislike') => {
        if (!current) return;
        try {
            await api.roomSwipe(code, current.id, direction);
        } catch (caught) {
            if (caught instanceof ApiError && caught.status === 401) { window.location.href = '/login'; return; }
        }
        setIndex((prev) => prev + 1);
    };

    const copyCode = async () => {
        try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
    };

    if (error) {
        return <div className="max-w-md mx-auto p-6 pt-12 text-center"><p className="mb-4">{error}</p><Link to="/room" className="inline-block px-6 py-3 bg-primary rounded-xl font-bold">К комнатам</Link></div>;
    }
    if (!room) return <div className="p-10 text-center text-subtext">Подключаемся к комнате…</div>;

    const partner = room.role === 'host' ? room.guest : room.host;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-6 pb-24 relative">
            {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-surface border border-primary/50 rounded-xl px-4 py-3 shadow-xl text-sm max-w-[90vw] text-center">{toast}</div>}

            <div className="flex items-center justify-between gap-3 mb-4 bg-surface rounded-xl p-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-subtext uppercase">Код</span>
                    <button onClick={copyCode} className="font-mono font-bold tracking-widest text-lg flex items-center gap-2 hover:text-primary">{code}{copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-subtext" />}</button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-primary" />
                    <span>{room.host.name}</span>
                    <span className="text-subtext">·</span>
                    <span className={room.guest ? '' : 'text-subtext'}>{room.guest ? room.guest.name : 'ждём…'}</span>
                </div>
            </div>

            {!room.ready && <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 text-sm text-center">Поделитесь кодом <b className="font-mono">{code}</b> с другом. Свайпать можно уже сейчас — мэтч появится, когда вы оба лайкнете один фильм.</div>}

            {room.matches.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase text-subtext mb-2">Мэтчи ({room.matches.length})</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {room.matches.map((movie) => (
                            <Link key={movie.id} to={`/movie/${movie.id}`} className="shrink-0 w-24">
                                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 mb-1">{movie.posterUrl && <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />}</div>
                                <div className="text-xs font-semibold truncate">{movie.title}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-center text-sm text-subtext mb-3">Подбираете вместе с {partner ? partner.name : 'другом'}</div>

            {current ? (
                <div className="max-w-sm mx-auto">
                    <div className="relative rounded-3xl overflow-hidden bg-surface shadow-2xl">
                        <img src={current.posterUrl} alt={current.title} className="w-full aspect-[2/3] object-cover" />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1"><Star size={12} className="text-yellow-400" fill="currentColor" />{current.rating}</div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                            <h2 className="text-xl font-bold">{current.title}</h2>
                            <p className="text-xs text-subtext">{current.year} · {current.genres.join(', ')}</p>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-5">
                        <button onClick={() => swipe('dislike')} className="w-16 h-16 rounded-full bg-surface border border-white/10 shadow-xl flex items-center justify-center text-primary text-2xl hover:scale-110 transition-transform">✕</button>
                        <button onClick={() => swipe('like')} className="w-16 h-16 rounded-full bg-primary shadow-[0_0_20px_rgba(229,9,20,0.4)] flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform">♥</button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-subtext">Фильмы закончились. Ваши мэтчи — выше ☝️</div>
            )}
        </div>
    );
}

export function Room() {
    const { code } = useParams();
    return code ? <RoomSession code={code} /> : <Lobby />;
}
