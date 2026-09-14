import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Calendar, Users, Clapperboard, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from '../components/Badge';
import { api, ApiError } from '../api/client';
import { useSession } from '../hooks/useSession';
import type { Movie, ReviewList } from '../types';

function Stars({ value, onSelect }: { value: number; onSelect?: (rating: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= value;
                const StarIcon = (
                    <Star size={onSelect ? 28 : 16} className={filled ? 'text-yellow-400' : 'text-white/20'} fill={filled ? 'currentColor' : 'none'} />
                );
                return onSelect ? (
                    <button key={star} type="button" onClick={() => onSelect(star)} className="hover:scale-110 transition-transform" aria-label={`${star} звёзд`}>
                        {StarIcon}
                    </button>
                ) : (
                    <span key={star}>{StarIcon}</span>
                );
            })}
        </div>
    );
}

export function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSession();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<ReviewList | null>(null);
    const [myRating, setMyRating] = useState(0);
    const [myText, setMyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reviewMessage, setReviewMessage] = useState('');

    useEffect(() => {
        if (!id) return;
        api.movie(id).then(setMovie).finally(() => setLoading(false));
        api.reviews(id).then((data) => {
            setReviews(data);
            const mine = data.reviews.find((review) => review.author.id === user?.id);
            if (mine) {
                setMyRating(mine.rating);
                setMyText(mine.text);
            }
        }).catch(() => undefined);
    }, [id, user?.id]);

    const mine = reviews?.reviews.find((review) => review.author.id === user?.id);

    const submitReview = async () => {
        if (!id || myRating < 1) {
            setReviewMessage('Поставьте оценку от 1 до 5 звёзд');
            return;
        }
        setSubmitting(true);
        setReviewMessage('');
        try {
            setReviews(await api.submitReview(id, myRating, myText.trim()));
        } catch (caught) {
            setReviewMessage(caught instanceof ApiError ? caught.message : 'Не удалось сохранить отзыв');
        } finally {
            setSubmitting(false);
        }
    };

    const removeReview = async () => {
        if (!id) return;
        try {
            setReviews(await api.deleteReview(id));
            setMyRating(0);
            setMyText('');
        } catch (caught) {
            setReviewMessage(caught instanceof ApiError ? caught.message : 'Не удалось удалить отзыв');
        }
    };

    if (loading) return <div className="p-10 text-center text-subtext">Загружаем фильм…</div>;
    if (!movie) return <div className="p-10 text-center">Фильм не найден</div>;

    return (
        <div className="relative min-h-screen bg-background pb-20">
            <div className="relative h-[50vh] md:h-[70vh]">
                <img src={movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="px-6 -mt-20 md:-mt-72 relative z-10">
                <div className="flex gap-4 items-end mb-6">
                    <img src={movie.posterUrl} alt={movie.title} className="w-32 h-48 md:w-64 md:h-96 rounded-xl shadow-2xl mr-auto border-2 border-white/10" />
                </div>

                <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>

                <div className="flex items-center gap-4 text-subtext text-sm mb-6">
                    <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 w-4 h-4" fill="currentColor" />
                        <span className="text-white font-bold">{movie.rating}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{movie.year}</span>
                    </div>
                    {reviews && reviews.count > 0 && (
                        <>
                            <span>•</span>
                            <span>Оценка зрителей: <span className="text-white font-bold">{reviews.average}</span>/5 ({reviews.count})</span>
                        </>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {movie.genres.map(g => <Badge key={g} variant="primary" className="bg-white/10 text-white hover:bg-white/20 transition-colors">{g}</Badge>)}
                </div>

                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <Clapperboard size={18} className="text-primary" />
                            Описание
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{movie.description}</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Актёры и режиссёр
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface p-4 rounded-xl">
                                <div className="text-xs text-subtext uppercase mb-1">Режиссёр</div>
                                <div className="font-medium">{movie.director}</div>
                            </div>
                            <div className="bg-surface p-4 rounded-xl">
                                <div className="text-xs text-subtext uppercase mb-1">В ролях</div>
                                <div className="font-medium">{movie.cast.join(', ')}</div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <MessageSquare size={18} className="text-primary" />
                            Отзывы
                            {reviews && reviews.count > 0 && <span className="text-subtext font-normal text-base">· {reviews.average}/5 ({reviews.count})</span>}
                        </h3>

                        {user ? (
                            <div className="bg-surface p-4 rounded-xl mb-4">
                                <div className="text-sm text-subtext mb-2">{mine ? 'Ваш отзыв' : 'Оставьте отзыв'}</div>
                                <Stars value={myRating} onSelect={setMyRating} />
                                <textarea
                                    value={myText}
                                    onChange={(event) => setMyText(event.target.value)}
                                    maxLength={500}
                                    placeholder="Короткая рецензия (необязательно)…"
                                    className="w-full bg-background border border-white/10 rounded-xl p-3 mt-3 min-h-[80px] resize-y"
                                />
                                {reviewMessage && <div className="text-sm text-primary mt-2">{reviewMessage}</div>}
                                <div className="flex gap-3 mt-3">
                                    <button onClick={submitReview} disabled={submitting} className="px-5 py-2 bg-primary rounded-xl font-semibold disabled:opacity-50">
                                        {submitting ? 'Сохранение…' : mine ? 'Обновить отзыв' : 'Оставить отзыв'}
                                    </button>
                                    {mine && (
                                        <button onClick={removeReview} className="px-4 py-2 bg-white/10 rounded-xl font-semibold flex items-center gap-2 hover:bg-white/20 transition-colors">
                                            <Trash2 size={16} />Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface p-4 rounded-xl mb-4 text-subtext text-sm">Войдите, чтобы оставить отзыв.</div>
                        )}

                        <div className="space-y-3">
                            {reviews?.reviews.map((review) => (
                                <div key={review.id} className="bg-surface p-4 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                                            {review.author.avatarUrl ? <img src={review.author.avatarUrl} alt={review.author.name} className="w-full h-full object-cover" /> : <Users size={16} />}
                                        </div>
                                        <div className="font-semibold flex-1">{review.author.name}{review.author.id === user?.id && <span className="text-subtext font-normal"> · вы</span>}</div>
                                        <Stars value={review.rating} />
                                    </div>
                                    {review.text && <p className="text-gray-300 text-sm leading-relaxed">{review.text}</p>}
                                    <div className="text-xs text-subtext mt-2">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</div>
                                </div>
                            ))}
                            {reviews && reviews.count === 0 && <div className="text-subtext py-2">Пока нет отзывов. Будьте первым!</div>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
