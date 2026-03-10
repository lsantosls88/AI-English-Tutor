import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, updateStats, getSetting } from '../db';
import { speak, speakLearningMode, startListening, comparePronunciation } from '../utils/speech';
import { Volume2, Mic, ArrowLeft, RotateCcw, Frown, Meh, Smile, Target, Snail, Zap, RefreshCw, BookOpen, Flame, Compass, Hash } from 'lucide-react';

export default function ExtraReview() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'all'; // 'all', 'hard', 'filter'

    // Filter State
    const [filterTags, setFilterTags] = useState('');
    const [filterType, setFilterType] = useState('All'); // 'All', 'Word', 'Phrase'
    const [filterReady, setFilterReady] = useState(mode !== 'filter');

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
        if (!filterReady) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            let allCards = await db.cards.toArray();
            let filteredCards = [];

            if (mode === 'hard') {
                // Cards with high failure rate (low ease factor) or frequently reviewed
                filteredCards = allCards.filter(c => c.ease_factor < 2.5).sort((a, b) => a.ease_factor - b.ease_factor);
                if (filteredCards.length === 0) {
                    // Fallback to recent cards if they don't have hard ones
                    filteredCards = allCards.sort((a, b) => b.created_at - a.created_at).slice(0, 20);
                }
            } else if (mode === 'filter') {
                filteredCards = allCards.filter(c => {
                    const matchType = filterType === 'All' || c.type === filterType;
                    const matchTag = filterTags === '' || (c.tags && c.tags.toLowerCase().includes(filterTags.toLowerCase()));
                    return matchType && matchTag;
                });
            } else {
                // 'all' - shuffle all cards (limit to ~30 for a session)
                filteredCards = allCards.sort(() => 0.5 - Math.random()).slice(0, 30);
            }

            setCards(filteredCards);
            const prefAccent = await getSetting('accent', 'US');
            setAccent(prefAccent);
            setLoading(false);
        };
        loadData();
    }, [mode, filterReady, filterTags, filterType]);

    const handleFlip = () => {
        if (!flipped) setFlipped(true);
    };

    const handleScore = async () => {
        if (cards.length === 0) return;

        // In Extra Review, we DO NOT calculate SM-2.
        // We only log it as an extra review for stats.
        await updateStats(false, true); // isExtra = true

        // Move to next card or finish
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFlipped(false);
            setFeedback(null);
        } else {
            // Done with this extra batch!
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

    if (loading) return <div className="flex-center p-8"><p>Preparando revisão...</p></div>;

    // Filter UI
    if (mode === 'filter' && !filterReady) {
        return (
            <div className="flex-col gap-4">
                <div className="flex-between">
                    <button className="btn-icon" onClick={() => navigate('/')}>
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-secondary font-semibold">Configurar Revisão</span>
                    <div style={{ width: 40 }} /> {/* spacer */}
                </div>

                <div className="card text-center mb-6" style={{ background: 'var(--bg-tertiary)' }}>
                    <Hash size={40} className="mb-4 text-primary mx-auto" />
                    <h2>Filtro de Cards</h2>
                    <p className="text-secondary text-sm">Escolha o que você quer revisar agora. O algoritmo de aprendizado não será afetado.</p>
                </div>

                <div className="form-group">
                    <label>Tipo de Item</label>
                    <div className="flex-between gap-2">
                        <button
                            className={`btn flex-1 ${filterType === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterType('All')}
                        >
                            Todos
                        </button>
                        <button
                            className={`btn flex-1 ${filterType === 'Word' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterType('Word')}
                        >
                            Palavra
                        </button>
                        <button
                            className={`btn flex-1 ${filterType === 'Phrase' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterType('Phrase')}
                        >
                            Frase
                        </button>
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label>Filtrar por Tag</label>
                    <input
                        className="input"
                        type="text"
                        placeholder="Ex: viagem, verbs"
                        value={filterTags}
                        onChange={(e) => setFilterTags(e.target.value)}
                    />
                </div>

                <button className="btn btn-primary" style={{ height: '3.5rem' }} onClick={() => setFilterReady(true)}>
                    <Zap size={20} /> Começar Revisão Extra
                </button>
            </div>
        );
    }

    if (cards.length === 0) return (
        <div className="card text-center flex-col flex-center py-12">
            <div style={{ background: 'var(--success-light)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                <Compass size={48} color="var(--success)" />
            </div>
            <h2 className="mb-2">Tudo Feito! 🎉</h2>
            <p className="text-secondary mb-6">Você concluiu os cards baseados no seu filtro.</p>
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
                <span className="text-secondary font-semibold" style={{ color: 'var(--warning)' }}>
                    Extra Mode • {currentIndex + 1} / {cards.length}
                </span>
                <div style={{ width: 40 }} /> {/* spacer */}
            </div>

            {/* Main Flashcard */}
            <div
                className="card border-warning"
                style={{
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: flipped ? 'default' : 'pointer',
                    position: 'relative',
                    borderColor: 'var(--warning)',
                    boxShadow: '0 8px 32px rgba(255,165,0,0.1)'
                }}
                onClick={handleFlip}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span className="badge mb-4 text-warning" style={{ background: 'var(--warning-light)' }}>
                        {card.type} (Extra)
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
                        <button className="btn flex-1" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }} onClick={playLearningMode} disabled={isPlaying} title="Modo Aprendizado">
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

            {/* Extra Mode Buttons (Simplified) */}
            {flipped && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', animation: 'fadeIn 0.4s ease' }}>
                    <button className="btn flex-col flex-center py-4"
                        style={{ background: 'var(--accent-primary)', color: 'white', border: '1px solid var(--accent-primary)' }}
                        onClick={handleScore}>
                        <ArrowLeft size={24} className="mb-1" style={{ transform: 'rotate(180deg)' }} />
                        <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Próximo Card</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(O agendamento não será alterado)</span>
                    </button>
                </div>
            )}
        </div>
    );
}
