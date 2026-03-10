import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCardsToReview, updateCardReview, updateStats, getSetting } from '../db';
import { calculateSM2 } from '../utils/sm2';
import { speak, speakLearningMode, startListening, comparePronunciation } from '../utils/speech';
import { Volume2, Mic, ArrowLeft, RotateCcw, Frown, Meh, Smile, Target, Snail, Zap, RefreshCw, BookOpen } from 'lucide-react';

export default function Review() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    // Pronunciation feedback
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [accent, setAccent] = useState('US');
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const dueCards = await getCardsToReview();
            setCards(dueCards);
            const prefAccent = await getSetting('accent', 'US');
            setAccent(prefAccent);
            setLoading(false);
        };
        loadData();
    }, []);

    const handleFlip = () => {
        if (!flipped) setFlipped(true);
    };

    const handleScore = async (quality) => {
        if (cards.length === 0) return;

        // Map Anki-style quality to our scale
        // quality mapping: Wrong=0, Hard=3, Good=4, Easy=5

        const card = cards[currentIndex];
        const sm2Result = calculateSM2(quality, card.repetitions || 0, card.interval || 0, card.ease_factor || 2.5);

        // Update Database
        await updateCardReview(card.id, sm2Result);
        await updateStats(quality >= 3); // correct if not 'Wrong'

        // Move to next card or finish
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFlipped(false);
            setFeedback(null);
        } else {
            // Done for today!
            setCards([]);
        }
    };

    const playTTS = (speed = 'normal') => {
        if (cards[currentIndex]) {
            setIsPlaying(true);
            speak(cards[currentIndex].english, accent, speed, () => setIsPlaying(false));
        }
    };

    const playLearningMode = async () => {
        if (cards[currentIndex] && !isPlaying) {
            setIsPlaying(true);
            await speakLearningMode(cards[currentIndex].english, accent);
            setIsPlaying(false);
        }
    };

    const playRepeat = async (times = 3) => {
        if (!cards[currentIndex] || isPlaying) return;
        setIsPlaying(true);

        for (let i = 0; i < times; i++) {
            await new Promise((resolve) => {
                speak(cards[currentIndex].english, accent, 'normal', resolve);
            });
            if (i < times - 1) {
                await new Promise(r => setTimeout(r, 1000)); // 1s pause between repeats
            }
        }
        setIsPlaying(false);
    };

    const toggleRecording = (e) => {
        e.stopPropagation();
        if (isListening || isPlaying) return;

        setIsListening(true);
        setFeedback({ type: 'info', text: 'Ouvindo...' });

        startListening(
            (transcript) => {
                setIsListening(false);
                const cardWord = cards[currentIndex].english;
                const result = comparePronunciation(cardWord, transcript);

                if (result.isPerfect) {
                    setFeedback({ type: 'success', text: `Perfeito! Você disse: "${transcript}"` });
                } else if (result.accuracy > 50) {
                    setFeedback({ type: 'warning', text: `Quase lá. Você disse: "${transcript}".` });
                } else {
                    setFeedback({ type: 'error', text: `Tente novamente. Entendi: "${transcript}".` });
                }
            },
            (error) => {
                setIsListening(false);
                setFeedback({ type: 'error', text: `Erro: ${error}` });
            },
            accent === 'US' ? 'en-US' : 'en-GB'
        );
    };

    if (loading) return <div className="flex-center p-8"><p>Carregando revisões...</p></div>;

    if (cards.length === 0) return (
        <div className="card text-center flex-col flex-center py-12">
            <div style={{ background: 'var(--success-light)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <Target size={48} color="var(--success)" />
            </div>
            <h2 className="mb-2">Tudo em dia! 🎉</h2>
            <p className="text-secondary mb-6">Você não tem mais revisões pendentes por hoje.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
                <ArrowLeft size={20} /> Voltar para Home
            </button>
        </div>
    );

    const card = cards[currentIndex];

    return (
        <div className="flex-col gap-4">
            <div className="flex-between">
                <button className="btn-icon" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                </button>
                <span className="text-secondary font-semibold">
                    {currentIndex + 1} / {cards.length}
                </span>
            </div>

            {/* Main Flashcard */}
            <div
                className="card"
                style={{
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: flipped ? 'default' : 'pointer',
                    position: 'relative'
                }}
                onClick={handleFlip}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span className="badge mb-4 text-secondary" style={{ background: 'var(--bg-tertiary)' }}>
                        {card.type}
                    </span>

                    <h2 style={{ fontSize: card.type === 'Phrase' ? '1.5rem' : '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                        {card.english}
                    </h2>

                    {!flipped && (
                        <p className="text-tertiary animate-pulse mt-8 flex-center gap-2">
                            <RotateCcw size={16} /> Toque para virar
                        </p>
                    )}

                    {flipped && (
                        <div className="flex-col gap-4 text-center mt-2 w-full pt-4" style={{ animation: 'fadeIn 0.3s ease', borderTop: '1px solid var(--border-color)' }}>
                            {card.translation && (
                                <div>
                                    <h4 className="text-xs text-secondary uppercase tracking-wider mb-1">Tradução</h4>
                                    <p style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: '500' }}>{card.translation}</p>
                                </div>
                            )}

                            {card.example && (
                                <div>
                                    <h4 className="text-xs text-secondary uppercase tracking-wider mb-1">Exemplo</h4>
                                    <p className="italic text-secondary">"{card.example}"</p>
                                </div>
                            )}

                            {card.notes && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-primary)', textAlign: 'left' }}>
                                    <h4 className="text-xs text-secondary uppercase tracking-wider mb-1 text-center">Dica do Tutor IA</h4>
                                    <p className="text-sm text-secondary text-center">{card.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pronunciation Controls */}
                <div className="flex-col gap-3 mt-6 p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }} onClick={(e) => e.stopPropagation()}>
                    <div className="flex-between gap-2">
                        <button className="btn btn-secondary flex-1" onClick={() => playTTS('slow')} disabled={isPlaying} title="Falar devagar">
                            <Snail size={18} /> Lento
                        </button>
                        <button className="btn btn-primary flex-1" onClick={() => playTTS('normal')} disabled={isPlaying} title="Falar normal">
                            <Zap size={18} /> Normal
                        </button>
                        <button className="btn btn-secondary flex-1" onClick={() => playRepeat(3)} disabled={isPlaying} title="Repetir 3x">
                            <RefreshCw size={18} /> 3x
                        </button>
                    </div>
                    <div className="flex-between gap-2">
                        <button className="btn flex-1" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }} onClick={playLearningMode} disabled={isPlaying} title="Modo Aprendizado">
                            <BookOpen size={18} /> Aprender
                        </button>
                        <button
                            className={`btn flex-1 ${isListening ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={toggleRecording}
                            disabled={isPlaying}
                            style={{ background: isListening ? 'var(--danger)' : '' }}
                        >
                            <Mic size={18} className={isListening ? "animate-pulse" : ""} /> Gravar
                        </button>
                    </div>
                </div>

                {/* Pronunciation Feedback message */}
                {feedback && (
                    <div className="mt-4 text-center p-2 rounded text-sm w-full font-medium"
                        style={{
                            backgroundColor: feedback.type === 'success' ? 'var(--success-light)' : feedback.type === 'error' ? 'var(--danger-light)' : 'var(--warning-light)',
                            color: feedback.type === 'success' ? 'var(--success)' : feedback.type === 'error' ? 'var(--danger)' : 'var(--warning)',
                            animation: 'fadeIn 0.3s ease'
                        }}>
                        {feedback.text}
                    </div>
                )}
            </div>

            {/* Spaced Repetition Buttons */}
            {flipped && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', animation: 'fadeIn 0.4s ease' }}>
                    <button className="btn flex-col flex-center py-4"
                        style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                        onClick={() => handleScore(0)}>
                        <Frown size={24} className="mb-1" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Errei</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>&lt; 10m</span>
                    </button>

                    <button className="btn flex-col flex-center py-4"
                        style={{ background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning)' }}
                        onClick={() => handleScore(3)}>
                        <Meh size={24} className="mb-1" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Difícil</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>1 dia</span>
                    </button>

                    <button className="btn flex-col flex-center py-4"
                        style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}
                        onClick={() => handleScore(4)}>
                        <Smile size={24} className="mb-1" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Bom</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{card.interval ? card.interval * 2 : 2}d</span>
                    </button>

                    <button className="btn flex-col flex-center py-4"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
                        onClick={() => handleScore(5)}>
                        <Target size={24} className="mb-1" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Fácil</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{card.interval ? card.interval * 3 : 4}d</span>
                    </button>
                </div>
            )}
        </div>
    );
}
