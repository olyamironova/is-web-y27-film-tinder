import { useState } from 'react';
import { CURRENT_USER } from '../mocks/data';
import { Settings, Users, Camera } from 'lucide-react';

export function Account() {
    const user = CURRENT_USER;
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    return (
        <div className="p-6 pb-24 relative">
            <div className="flex flex-col items-center mb-10">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-2xl mb-4">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    {isEditing && (
                        <button className="absolute bottom-4 right-0 bg-surface border border-white/20 p-2 rounded-full hover:bg-white/10">
                            <Camera size={16} />
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <>
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        <p className="text-subtext">Киноман</p>
                    </>
                ) : (
                    <div className="flex flex-col gap-2 w-full max-w-xs text-center">
                        <input type="text" defaultValue={user.name} className="bg-surface border border-white/10 p-2 rounded-lg text-center" placeholder="Имя" />
                        <input type="email" defaultValue="user@mail.ru" className="bg-surface border border-white/10 p-2 rounded-lg text-center" placeholder="Email" />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <div className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px]">
                    <span className="text-3xl font-bold text-white">{user.likedMovies.length}</span>
                    <span className="text-xs text-subtext uppercase mt-1">Нравится</span>
                </div>
                <div className="bg-surface p-4 rounded-2xl flex flex-col items-center w-full max-w-[150px]">
                    <span className="text-3xl font-bold text-white">{user.friends.length}</span>
                    <span className="text-xs text-subtext uppercase mt-1">Друзья</span>
                </div>
            </div>

            <div className="space-y-6">
                {!isEditing && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Users size={20} className="text-primary" />
                                Друзья
                            </h3>
                            <button className="text-primary text-sm font-semibold">Все</button>
                        </div>

                        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                            {user.friends.map(friend => (
                                <div key={friend.id} className="flex items-center gap-4 bg-surface p-3 rounded-xl">
                                    <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <div className="font-semibold">{friend.name}</div>
                                        <div className="text-xs text-subtext">{friend.likedMovies.length} общих</div>
                                    </div>
                                </div>
                            ))}
                            {user.friends.length === 0 && (
                                <div className="text-subtext text-center py-4">Нет друзей.</div>
                            )}
                        </div>
                    </section>
                )}

                {isEditing ? (
                    <div className="space-y-4">
                        <button onClick={() => setShowPasswordModal(true)} className="w-full py-4 bg-surface rounded-xl flex items-center justify-center gap-2 text-text font-semibold hover:bg-white/5 transition-colors">
                            Сменить пароль
                        </button>
                        <button onClick={() => setIsEditing(false)} className="w-full py-4 bg-primary text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg">
                            Сохранить
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-surface rounded-xl flex items-center justify-center gap-2 text-subtext hover:bg-white/5 transition-colors">
                        <Settings size={20} />
                        <span>Настройки</span>
                    </button>
                )}
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface p-6 rounded-3xl w-full max-w-sm border border-white/10 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold">Сменить пароль</h2>
                            <button onClick={() => setShowPasswordModal(false)}>✕</button>
                        </div>
                        <input type="password" placeholder="Старый пароль" className="w-full bg-background border border-white/10 p-3 rounded-xl" />
                        <input type="password" placeholder="Новый пароль" className="w-full bg-background border border-white/10 p-3 rounded-xl" />
                        <input type="password" placeholder="Подтвердить пароль" className="w-full bg-background border border-white/10 p-3 rounded-xl" />

                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-white/10 rounded-xl font-semibold">Отмена</button>
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
