import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Users, Clapperboard } from 'lucide-react';
import { MOVIES } from '../mocks/data';
import { Badge } from '../components/Badge';

export function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const movie = MOVIES.find(m => m.id === id);

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
                    <span>•</span>
                    <span>{movie.rating > 8 ? 'Шедевр' : 'Достойный просмотр'}</span>
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
                </div>
            </div>
        </div>
    );
}
