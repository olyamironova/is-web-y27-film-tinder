import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Camera, Check, Clock, Heart, LogOut, Settings, ThumbsDown, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Movie, User } from '../types';

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
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [likedMovies, setLikedMovies] = useState<Movie[] | null>(null);
    const [likesTitle, setLikesTitle] = useState('Нравится');
    const [likesEditable, setLikesEditable] = useState(false);

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
            setUser(await api.profile());
            setMessage('Заявка в друзья отправлена. Пользователь появится в списке после подтверждения.');
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось отправить заявку в друзья');
        } finally {
            setIsSendingFriendRequest(false);
        }
    };

    const showLikes = async (title: string, loader: () => Promise<Movie[]>, editable: boolean) => {
        setLikesTitle(title);
        setLikesEditable(editable);
        setShowLikesModal(true);
        setLikedMovies(null);
        try {
            setLikedMovies(await loader());
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось загрузить список');
            setShowLikesModal(false);
        }
    };

    const openLikes = () => showLikes('Нравится', api.myLikes, true);
    const openDislikes = () => showLikes('Дизлайки', api.myDislikes, true);
    const openWatchlist = () => showLikes('Посмотреть позже', api.myWatchlist, true);
    const openFriendLikes = (friend: User) => showLikes(`Нравится · ${friend.name}`, () => api.friendLikes(friend.id), false);

    const undoSwipe = async (movieId: string) => {
        try {
            await api.removeSwipe(movieId);
            setLikedMovies((prev) => (prev ? prev.filter((movie) => movie.id !== movieId) : prev));
            setUser(await api.profile());
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось отменить свайп');
        }
    };

    const acceptFriend = async (friendshipId: string) => {
        setMessage('');
        try {
            await api.acceptFriend(friendshipId);
            setUser(await api.profile());
            setMessage('Заявка принята');
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось принять заявку');
        }
    };

    const removeFriendship = async (friendshipId: string, successMessage: string) => {
        setMessage('');
        try {
            await api.removeFriend(friendshipId);
            setUser(await api.profile());
            setMessage(successMessage);
        } catch (caught) {
            setMessage(caught instanceof ApiError ? caught.message : 'Не удалось выполнить действие');
        }
    };

    const unfriend = (friend: User) => {
        if (friend.friendshipId && window.confirm(`Удалить из друзей: ${friend.name}?`)) {
            removeFriendship(friend.friendshipId, 'Удалён из друзей');
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
                <button onClick={openLikes} className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px] hover:bg-white/10 transition-colors"><span className="text-3xl font-bold">{user.likedMovies.length}</span><span className="text-xs text-subtext uppercase mt-1">Нравится</span></button>
                <button onClick={openDislikes} className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px] hover:bg-white/10 transition-colors"><span className="text-3xl font-bold">{user.dislikedMovies?.length ?? 0}</span><span className="text-xs text-subtext uppercase mt-1">Дизлайки</span></button>
                <button onClick={openWatchlist} className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px] hover:bg-white/10 transition-colors"><span className="text-3xl font-bold">{user.watchLaterMovies?.length ?? 0}</span><span className="text-xs text-subtext uppercase mt-1">Позже</span></button>
                <div className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px]"><span className="text-3xl font-bold">{user.friends.length}</span><span className="text-xs text-subtext uppercase mt-1">Друзья</span></div>
            </div>

            <div className="space-y-6 max-w-xl mx-auto">
                {!isEditing && user.incomingRequests && user.incomingRequests.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><UserPlus size={20} className="text-primary" />Входящие заявки</h3>
                        <div className="space-y-3">
                            {user.incomingRequests.map((requestItem) => (
                                <div key={requestItem.id} className="flex items-center gap-4 bg-surface p-3 rounded-xl">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">{requestItem.user.avatarUrl ? <img src={requestItem.user.avatarUrl} alt={requestItem.user.name} className="w-full h-full object-cover" /> : <Users size={20} />}</div>
                                    <div className="font-semibold flex-1">{requestItem.user.name}</div>
                                    <button onClick={() => acceptFriend(requestItem.id)} className="px-3 py-2 bg-primary rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"><Check size={18} />Принять</button>
                                    <button onClick={() => removeFriendship(requestItem.id, 'Заявка отклонена')} title="Отклонить" className="px-3 py-2 bg-white/10 rounded-xl font-semibold flex items-center gap-2 hover:bg-white/20 transition-colors"><X size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {!isEditing && <section><div className="flex items-center justify-between gap-4 mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><Users size={20} className="text-primary" />Друзья</h3><button onClick={() => { setMessage(''); setShowFriendModal(true); }} className="px-4 py-2 bg-primary rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors"><UserPlus size={18} />Добавить</button></div><div className="grid md:grid-cols-2 gap-3">{user.friends.map((friend) => <div key={friend.id} className="flex items-center gap-2 bg-surface p-3 rounded-xl"><button onClick={() => openFriendLikes(friend)} title={`Показать лайки: ${friend.name}`} className="flex items-center gap-4 flex-1 min-w-0 text-left"><div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center shrink-0">{friend.avatarUrl ? <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" /> : <Users size={20} />}</div><div className="font-semibold truncate flex-1">{friend.name}</div><Heart size={16} className="text-subtext shrink-0" /></button><button onClick={() => unfriend(friend)} title="Удалить из друзей" className="p-2 text-subtext hover:text-primary transition-colors shrink-0"><UserMinus size={18} /></button></div>)}{user.friends.length === 0 && <div className="text-subtext py-4">Нет друзей.</div>}</div></section>}

                {!isEditing && user.outgoingRequests && user.outgoingRequests.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Clock size={20} className="text-subtext" />Ожидают подтверждения</h3>
                        <div className="space-y-3">
                            {user.outgoingRequests.map((requestItem) => (
                                <div key={requestItem.id} className="flex items-center gap-4 bg-surface p-3 rounded-xl opacity-70">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">{requestItem.user.avatarUrl ? <img src={requestItem.user.avatarUrl} alt={requestItem.user.name} className="w-full h-full object-cover" /> : <Users size={20} />}</div>
                                    <div className="font-semibold flex-1">{requestItem.user.name}</div>
                                    <span className="text-xs text-subtext uppercase hidden sm:inline">Отправлена</span>
                                    <button onClick={() => removeFriendship(requestItem.id, 'Заявка отменена')} className="px-3 py-2 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-colors">Отменить</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

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

            {showLikesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowLikesModal(false)}>
                    <div className="bg-surface p-6 rounded-3xl w-full max-w-lg border border-white/10 max-h-[80vh] flex flex-col" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">{likesTitle.startsWith('Дизлайки') ? <ThumbsDown size={20} className="text-subtext" /> : likesTitle.startsWith('Посмотреть') ? <Bookmark size={20} className="text-subtext" /> : <Heart size={20} className="text-primary" />}{likesTitle}</h2>
                            <button onClick={() => setShowLikesModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="overflow-y-auto">
                            {likedMovies === null ? (
                                <div className="text-subtext py-8 text-center">Загружаем…</div>
                            ) : likedMovies.length === 0 ? (
                                <div className="text-subtext py-8 text-center">Список пуст.</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {likedMovies.map((movie) => (
                                        <div key={movie.id} className="relative group">
                                            <Link to={`/movie/${movie.id}`} onClick={() => setShowLikesModal(false)}>
                                                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-2">{movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : null}</div>
                                                <div className="text-sm font-semibold truncate">{movie.title}</div>
                                                <div className="text-xs text-subtext">{movie.year}</div>
                                            </Link>
                                            {likesEditable && (
                                                <button onClick={() => undoSwipe(movie.id)} title="Убрать (вернуть в ленту)" className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white rounded-full p-1.5"><X size={14} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
