import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCardsToReview, getStatsForToday, getSetting, getAllCards } from '../db';
import { PlayCircle, PlusCircle, PenTool, Flame, Target, Star, Compass, Hash } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ date: '', reviews: 0, correct: 0, extra_reviews: 0 });
    const [dailyGoal, setDailyGoal] = useState(15);
    const [onboarded, setOnboarded] = useState(true);

    const [itemsToReview, setItemsToReview] = useState([]);
    const [totalCards, setTotalCards] = useState(0);

    // Check if onboarded and load stats
    useEffect(() => {
        const init = async () => {
            try {
                const isReady = await getSetting('onboarded', false);
                if (!isReady) navigate('/onboarding');

                const s = await getStatsForToday();
                if (s) setStats(s);

                const goal = await getSetting('daily_goal', 15);
                setDailyGoal(goal);

                // Load cards info
                const reviewCards = await getCardsToReview();
                setItemsToReview(reviewCards);

                // Quick trick to get total cards without loading all: Supabase provides count, 
                // but db.js exports getAllCards for now. We can just use its length for small scale.
                const all = await getAllCards();
                setTotalCards(all.length);
            } catch (error) {
                console.error("Home loading error:", error);
            }
        };
        init();
    }, [navigate]);

    const goalMet = stats.reviews >= dailyGoal;
    const noPending = itemsToReview.length === 0;

    const shouldShowExtraModes = goalMet || noPending;

    return (
        <div>
            <div className="flex-between mb-6">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Olá! 👋</h2>
                    <p className="text-secondary">Pronto para praticar seu inglês?</p>
                </div>
                <div className="card flex-center gap-2" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                    <Flame size={20} color="var(--warning)" />
                    <span style={{ fontWeight: 'bold' }}>{stats.streak_active ? '1 Dia' : '0 Dias'}</span>
                </div>
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card flex-col flex-center">
                    <span className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800' }}>
                        {itemsToReview.length}
                    </span>
                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Revisões Pendentes</span>
                </div>
                <div className="card flex-col flex-center">
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>
                        {totalCards}
                    </span>
                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Total de Cards</span>
                </div>
            </div>

            {/* Today's Goal Progress */}
            <div className="card mb-6">
                <div className="flex-between mb-2">
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: goalMet ? 'var(--success)' : 'inherit' }}>
                        <Target size={18} /> Meta Diária ({dailyGoal} cards) {goalMet && '✔'}
                    </span>
                    <span className="text-secondary text-sm">{stats.reviews} / {dailyGoal}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.min((stats.reviews / dailyGoal) * 100, 100)}%`,
                        background: goalMet ? 'var(--success)' : 'var(--accent-primary)',
                        transition: 'width 1s ease-out'
                    }} />
                </div>

                {stats.extra_reviews > 0 && (
                    <p className="text-xs text-secondary mt-2 text-right">
                        + {stats.extra_reviews} revisões extras hoje
                    </p>
                )}
            </div>

            {/* Main Actions */}
            <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                {shouldShowExtraModes ? 'Revisão Extra (Modo Livre)' : 'Ações Rápidas'}
            </h3>

            <div className="flex-col gap-3">
                {!shouldShowExtraModes && (
                    <Link to="/review" className="btn btn-primary" style={{ height: '4rem', fontSize: '1.1rem' }}>
                        <PlayCircle size={24} />
                        Revisar Agora ({itemsToReview.length})
                    </Link>
                )}

                {shouldShowExtraModes && (
                    <div className="card flex-col gap-3 p-4" style={{ border: '1px solid var(--success-light)', backgroundColor: 'var(--success-light)' }}>
                        <p style={{ color: 'var(--success)', fontWeight: '600', textAlign: 'center', marginBottom: '0.5rem' }}>
                            ✔ Você já concluiu sua meta! Continue praticando se desejar.
                        </p>
                        <Link to="/extra-review?mode=all" className="btn btn-secondary w-full flex-between" style={{ background: 'var(--bg-secondary)' }}>
                            <span className="flex-center gap-2"><Compass size={18} /> Revisar Tudo</span>
                            <span className="text-tertiary text-xs">Aleatório</span>
                        </Link>
                        <Link to="/extra-review?mode=hard" className="btn btn-secondary w-full flex-between" style={{ background: 'var(--bg-secondary)' }}>
                            <span className="flex-center gap-2 text-warning"><Flame size={18} /> Palavras Difíceis</span>
                            <span className="text-tertiary text-xs">Apenas difíceis</span>
                        </Link>
                        <Link to="/extra-review?mode=filter" className="btn btn-secondary w-full flex-between" style={{ background: 'var(--bg-secondary)' }}>
                            <span className="flex-center gap-2"><Hash size={18} /> Filtro Personalizado</span>
                            <span className="text-tertiary text-xs">Tags / Tipos</span>
                        </Link>
                    </div>
                )}

                {!shouldShowExtraModes && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/add" className="btn btn-secondary flex-1" style={{ height: '3.5rem' }}>
                            <PlusCircle size={20} /> Adicionar Card
                        </Link>
                        <Link to="/notes" className="btn btn-secondary flex-1" style={{ height: '3.5rem' }}>
                            <PenTool size={20} /> Anotações
                        </Link>
                    </div>
                )}

                {shouldShowExtraModes && itemsToReview.length > 0 && (
                    <Link to="/review" className="btn btn-secondary w-full flex-center gap-2" style={{ borderStyle: 'dashed' }}>
                        <PlayCircle size={18} />
                        Apenas pendências normais ({itemsToReview.length})
                    </Link>
                )}
            </div>
        </div>
    );
}
