import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Camera, LogOut, Settings, UserPlus, Users } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { User } from '../types';

export function Account() {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [friendEmail, setFriendEmail] = useState('');
    const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [unauthorized, setUnauthorized] = useState(false);

    useEffect(() => {
        api.profile().then((profile) => {
            setUser(profile);
            setName(profile.name);
            setEmail(profile.email ?? '');
        }).catch((caught) => {
            if (caught instanceof ApiError && caught.status === 401) setUnauthorized(true);
            else setMessage('Не удалось загрузить профиль');
        });
    }, []);

    const saveProfile = async () => {
        try {
            const updated = await api.updateProfile({ name, email });
            setUser(updated);
            setIsEditing(false);
            setMessage('Профиль сохранён');
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось сохранить профиль');
        }
    };

    const changePassword = async () => {
        try {
            await api.changePassword(oldPassword, newPassword);
            setShowPasswordModal(false);
            setOldPassword('');
            setNewPassword('');
            setMessage('Пароль изменён');
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось изменить пароль');
        }
    };

    const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        try {
            const { avatarUrl } = await api.uploadAvatar(file);
            setUser({ ...user, avatarUrl });
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось загрузить аватар');
        }
    };

    const logout = async () => {
        await api.logout();
        window.location.href = '/login';
    };

    const requestFriend = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSendingFriendRequest(true);
        setMessage('');
        try {
            await api.requestFriend(friendEmail.trim());
            setFriendEmail('');
            setShowFriendModal(false);
            setMessage('Заявка в друзья отправлена. Пользователь появится в списке после подтверждения.');
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось отправить заявку в друзья');
        } finally {
            setIsSendingFriendRequest(false);
        }
    };

    if (unauthorized) {
        return <div className="h-[70vh] flex flex-col gap-4 items-center justify-center"><p>Войдите, чтобы открыть профиль.</p><Link className="bg-primary rounded-xl px-6 py-3 font-bold" to="/login">Войти</Link></div>;
    }
    if (!user) return <div className="p-10 text-center text-subtext">Загружаем профиль…</div>;

    return (
        <div className="p-6 pb-24 relative">
            {message && <div className="max-w-md mx-auto mb-4 bg-surface border border-white/10 rounded-xl p-3 text-center">{message}</div>}
            <div className="flex flex-col items-center mb-10">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-2xl mb-4 bg-surface flex items-center justify-center">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <Users size={42} className="text-subtext" />}
                    </div>
                    {isEditing && (
                        <label className="absolute bottom-4 right-0 bg-surface border border-white/20 p-2 rounded-full hover:bg-white/10 cursor-pointer">
                            <Camera size={16} />
                            <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} />
                        </label>
                    )}
                </div>

                {!isEditing ? (
                    <><h1 className="text-2xl font-bold">{user.name}</h1><p className="text-subtext">{user.email}</p></>
                ) : (
                    <div className="flex flex-col gap-2 w-full max-w-xs text-center">
                        <input value={name} onChange={(event) => setName(event.target.value)} className="bg-surface border border-white/10 p-2 rounded-lg text-center" placeholder="Имя" />
                        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="bg-surface border border-white/10 p-2 rounded-lg text-center" placeholder="Email" />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <div className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px]"><span className="text-3xl font-bold">{user.likedMovies.length}</span><span className="text-xs text-subtext uppercase mt-1">Нравится</span></div>
                <div className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px]"><span className="text-3xl font-bold">{user.friends.length}</span><span className="text-xs text-subtext uppercase mt-1">Друзья</span></div>
            </div>

            <div className="space-y-6 max-w-xl mx-auto">
                {!isEditing && <section><div className="flex items-center justify-between gap-4 mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><Users size={20} className="text-primary" />Друзья</h3><button onClick={() => { setMessage(''); setShowFriendModal(true); }} className="px-4 py-2 bg-primary rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"><UserPlus size={18} />Добавить</button></div><div className="grid md:grid-cols-2 gap-3">{user.friends.map((friend) => <div key={friend.id} className="flex items-center gap-4 bg-surface p-3 rounded-xl"><div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"><Users size={20} /></div><div className="font-semibold">{friend.name}</div></div>)}{user.friends.length === 0 && <div className="text-subtext py-4">Нет друзей.</div>}</div></section>}

                {isEditing ? (
                    <div className="space-y-4">
                        <button onClick={() => setShowPasswordModal(true)} className="w-full py-4 bg-surface rounded-xl font-semibold">Сменить пароль</button>
                        <button onClick={saveProfile} className="w-full py-4 bg-primary rounded-xl font-bold shadow-lg">Сохранить</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-surface rounded-xl flex items-center justify-center gap-2 text-subtext"><Settings size={20} />Настройки</button>
                )}
                {user.role === 'admin' && <a href="/admin/movies" className="block text-center w-full py-4 bg-white/5 rounded-xl font-semibold">Администрирование фильмов</a>}
                <button onClick={logout} className="w-full py-4 bg-white/5 rounded-xl flex items-center justify-center gap-2 text-subtext"><LogOut size={20} />Выйти</button>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-surface p-6 rounded-3xl w-full max-w-sm border border-white/10 space-y-4">
                        <h2 className="text-xl font-bold">Сменить пароль</h2>
                        <input value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} type="password" placeholder="Старый пароль" className="w-full bg-background border border-white/10 p-3 rounded-xl" />
                        <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="Новый пароль (минимум 8 символов)" className="w-full bg-background border border-white/10 p-3 rounded-xl" />
                        <div className="flex gap-4"><button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-white/10 rounded-xl">Отмена</button><button onClick={changePassword} className="flex-1 py-3 bg-primary rounded-xl font-bold">Сохранить</button></div>
                    </div>
                </div>
            )}

            {showFriendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <form onSubmit={requestFriend} className="bg-surface p-6 rounded-3xl w-full max-w-sm border border-white/10 space-y-4">
                        <div><h2 className="text-xl font-bold">Добавить друга</h2><p className="text-sm text-subtext mt-1">Введите email зарегистрированного пользователя.</p></div>
                        <input autoFocus required value={friendEmail} onChange={(event) => setFriendEmail(event.target.value)} type="email" placeholder="friend@example.com" className="w-full bg-background border border-white/10 p-3 rounded-xl" />
                        <div className="flex gap-4"><button type="button" onClick={() => { setShowFriendModal(false); setFriendEmail(''); }} className="flex-1 py-3 bg-white/10 rounded-xl">Отмена</button><button type="submit" disabled={isSendingFriendRequest} className="flex-1 py-3 bg-primary rounded-xl font-bold disabled:opacity-50">{isSendingFriendRequest ? 'Отправка…' : 'Отправить'}</button></div>
                    </form>
                </div>
            )}
        </div>
    );
}
