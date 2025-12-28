import { useEffect } from 'react';
import { motion, type PanInfo, useMotionValue, useTransform } from 'framer-motion';
import type { Movie } from '../types';
import { Badge } from './Badge';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
    movie: Movie;
    onSwipe?: (direction: 'left' | 'right') => void;
    isFront?: boolean;
    custom?: number;
}

export function MovieCard({ movie, onSwipe, isFront = false, custom }: MovieCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [20, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);

    useEffect(() => {
        if (isFront) {
            x.set(0);
        }
    }, [isFront, x]);

    const onDragEnd = (_: any, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 100 && onSwipe) {
            onSwipe(info.offset.x > 0 ? 'right' : 'left');
        }
    };

    const exitAnim = {
        exit: (dir: number) => {
            if (dir === 0) return {};
            return {
                x: dir > 0 ? 600 : -600,
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.25 }
            };
        }
    };

    return (
        <motion.div
            custom={custom}
            variants={exitAnim}
            style={{
                x: isFront ? x : undefined,
                rotate: isFront ? rotate : undefined,
                opacity: isFront ? opacity : 0.5,
                zIndex: isFront ? 10 : 0
            }}
            drag={isFront ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={onDragEnd}
            initial={{ scale: 0.95, y: -20 }}
            animate={{
                scale: isFront ? 1 : 0.95,
                y: isFront ? 0 : -20,
                x: isFront ? undefined : 0,
                rotate: isFront ? undefined : 0
            }}
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-10 w-full max-w-md left-0 right-0 mx-auto h-[75vh] rounded-[2.5rem] overflow-hidden shadow-2xl bg-surface cursor-grab active:cursor-grabbing border border-white/5"
        >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img src={movie.posterUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />

            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="text-yellow-400 w-4 h-4" fill="currentColor" />
                <span className="font-bold text-sm">{movie.rating}</span>
            </div>

            <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-20 flex flex-col gap-1.5">
                <h2 className="text-2xl font-bold text-white leading-tight">{movie.title}</h2>

                <div className="flex flex-wrap gap-2 my-1">
                    {movie.genres.slice(0, 3).map(g => (
                        <Badge key={g} variant="outline" className="border-white/20 text-white/90 text-[10px] px-2 py-0.5">{g}</Badge>
                    ))}
                </div>

                <p className="text-xs text-gray-400 line-clamp-2">{movie.description}</p>

                <div className="mt-3 flex gap-3">
                    <Link to={`/movie/${movie.id}`} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors pointer-events-auto text-sm" onPointerDown={(e) => e.stopPropagation()}>
                        О фильме
                    </Link>
                </div>
            </div>

            {isFront && (
                <>
                    <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-10 border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-15deg] z-30">
                        <span className="text-4xl font-black text-green-500 uppercase tracking-widest">LIKE</span>
                    </motion.div>
                    <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-10 border-4 border-primary rounded-lg px-4 py-2 rotate-[15deg] z-30">
                        <span className="text-4xl font-black text-primary uppercase tracking-widest">NOPE</span>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}
