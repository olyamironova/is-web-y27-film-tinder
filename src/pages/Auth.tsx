import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';

export function Auth({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(mode === 'login' ? 'user@film-tinder.local' : '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(mode === 'login' ? 'User12345!' : '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      if (mode === 'login') await api.login(email, password);
      else await api.register(email, name, password);
      const next = new URLSearchParams(location.search).get('next') || '/';
      window.location.href = next;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Не удалось связаться с сервером');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
      <form onSubmit={submit} className="bg-surface border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-2xl font-bold">{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
        {error && <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-sm">{error}</div>}
        {mode === 'register' && <input value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-background border border-white/10 p-3 rounded-xl" placeholder="Имя" required minLength={2} />}
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full bg-background border border-white/10 p-3 rounded-xl" placeholder="Email" required />
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full bg-background border border-white/10 p-3 rounded-xl" placeholder="Пароль" required minLength={8} />
        <button disabled={pending} className="w-full py-3 bg-primary rounded-xl font-bold disabled:opacity-50">{pending ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
        <button type="button" onClick={() => navigate(-1)} className="w-full py-3 bg-white/5 rounded-xl">Назад</button>
        <p className="text-sm text-subtext text-center">
          {mode === 'login' ? <>Нет аккаунта? <Link className="text-primary" to="/register">Зарегистрироваться</Link></> : <>Уже есть аккаунт? <Link className="text-primary" to="/login">Войти</Link></>}
        </p>
      </form>
    </div>
  );
}
