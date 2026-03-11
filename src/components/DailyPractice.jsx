import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateDailyLesson, saveDailyLessonCards, getSetting } from '../db';
import { speak } from '../utils/speech';
import { Volume2, ChevronRight, ChevronLeft, Sparkles, CheckCircle, ArrowLeft, Loader, ChevronDown, BookOpen, Mic } from 'lucide-react';

export default function DailyPractice() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState('loading');
    const [lesson, setLesson] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [accent, setAccent] = useState('US');
    const [speakingId, setSpeakingId] = useState(null);
    const [expandedTips, setExpandedTips] = useState({}); // { "0-0": true, "0-1": false, ... }

    useEffect(() => {
        const init = async () => {
            try {
                const userAccent = await getSetting('accent', 'US');
                setAccent(userAccent);

                const apiKey = await getSetting('gemini_api_key', '');
                if (!apiKey) {
                    setPhase('no-key');
                    return;
                }

                const result = await generateDailyLesson();

                if (!result) {
                    setPhase('no-key');
                    return;
                }

                if (result.alreadyDone) {
                    setPhase('completed');
                    return;
                }

                if (result.treino_diario && result.treino_diario.length > 0) {
                    setLesson(result.treino_diario);
                    setPhase('practicing');
                } else {
                    setPhase('error');
                }
            } catch (err) {
                console.error("Daily practice init error:", err);
                setPhase('error');
            }
        };
        init();
    }, []);

    const handleSpeak = (text, id, speed = 'normal') => {
        setSpeakingId(id);
        speak(text, accent, speed, () => setSpeakingId(null));
    };

    const toggleTip = (key) => {
        setExpandedTips(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleNext = () => {
        if (currentIndex < lesson.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setExpandedTips({}); // Reset expanded tips for new card
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setExpandedTips({});
        }
    };

    const handleComplete = async () => {
        setPhase('saving');
        try {
            await saveDailyLessonCards(lesson);
            setPhase('completed');
        } catch (err) {
            console.error("Error saving lesson cards:", err);
            setPhase('completed');
        }
    };

    // --- LOADING ---
    if (phase === 'loading') {
        return (
            <div className="flex-col flex-center" style={{ minHeight: '80vh', gap: '1.5rem' }}>
                <Sparkles size={48} color="var(--accent-primary)" className="animate-pulse" />
                <h2 style={{ fontWeight: '700' }}>Preparando seu treino...</h2>
                <p className="text-secondary text-center" style={{ maxWidth: '280px' }}>
                    A IA está gerando 3 novos termos personalizados para você
                </p>
                <div style={{ width: '200px', height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: 'var(--accent-primary)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
            </div>
        );
    }

    // --- NO API KEY ---
    if (phase === 'no-key') {
        return (
            <div className="flex-col flex-center" style={{ minHeight: '80vh', gap: '1.5rem', padding: '2rem' }}>
                <Sparkles size={48} color="var(--text-tertiary)" />
                <h2 style={{ fontWeight: '700', textAlign: 'center' }}>Chave de IA não configurada</h2>
                <p className="text-secondary text-center" style={{ maxWidth: '300px' }}>
                    Configure sua chave da API do Gemini nas Configurações para receber treinos diários.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/settings')} style={{ marginTop: '1rem' }}>
                    Ir para Configurações
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Voltar
                </button>
            </div>
        );
    }

    // --- ERROR ---
    if (phase === 'error') {
        return (
            <div className="flex-col flex-center" style={{ minHeight: '80vh', gap: '1.5rem', padding: '2rem' }}>
                <h2 style={{ fontWeight: '700' }}>Ops! Algo deu errado 😕</h2>
                <p className="text-secondary text-center">Não foi possível gerar o treino de hoje. Tente novamente mais tarde.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Voltar para Home
                </button>
            </div>
        );
    }

    // --- SAVING ---
    if (phase === 'saving') {
        return (
            <div className="flex-col flex-center" style={{ minHeight: '80vh', gap: '1.5rem' }}>
                <Loader size={40} color="var(--accent-primary)" className="animate-pulse" />
                <p className="text-secondary">Salvando seus novos cards...</p>
            </div>
        );
    }

    // --- COMPLETED ---
    if (phase === 'completed') {
        return (
            <div className="flex-col flex-center" style={{ minHeight: '80vh', gap: '1.5rem', padding: '2rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={40} color="var(--success)" />
                </div>
                <h2 style={{ fontWeight: '800', fontSize: '1.5rem' }}>Treino Concluído! 🎉</h2>
                <p className="text-secondary text-center" style={{ maxWidth: '300px' }}>
                    Os novos termos foram salvos nos seus cards e entrarão no ciclo de revisão.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem', width: '100%', maxWidth: '300px', height: '3.5rem', fontSize: '1.1rem' }}>
                    Voltar para Home
                </button>
            </div>
        );
    }

    // --- PRACTICING ---
    const item = lesson[currentIndex];
    const isLast = currentIndex === lesson.length - 1;

    return (
        <div className="flex-col" style={{ minHeight: '85vh', padding: '0.5rem' }}>
            {/* Header */}
            <div className="flex-between mb-4">
                <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                    <ArrowLeft size={16} /> Sair
                </button>
                <div className="flex-center gap-2">
                    <Sparkles size={18} color="var(--accent-primary)" />
                    <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>Treino do Dia</span>
                </div>
                <span className="text-secondary" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {currentIndex + 1}/{lesson.length}
                </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{
                    width: `${((currentIndex + 1) / lesson.length) * 100}%`,
                    height: '100%', background: 'var(--accent-primary)',
                    borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease-out'
                }} />
            </div>

            {/* Card Content */}
            <div className="card" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'auto' }}>
                {/* Term + Speak */}
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.2, color: 'var(--accent-primary)' }}>
                            {item.termo_ingles}
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: '500' }}>
                            {item.traducao_ptbr}
                        </p>
                    </div>
                    <div className="flex-col gap-1" style={{ alignItems: 'center' }}>
                        <button
                            onClick={() => handleSpeak(item.termo_ingles, 'term')}
                            style={{
                                background: speakingId === 'term' ? 'var(--accent-primary)' : 'var(--accent-light)',
                                color: speakingId === 'term' ? 'white' : 'var(--accent-primary)',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                width: '48px', height: '48px', padding: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                            }}
                        >
                            <Volume2 size={22} />
                        </button>
                        <button
                            onClick={() => handleSpeak(item.termo_ingles, 'term-slow', 'slow')}
                            title="Ouvir devagar"
                            style={{
                                background: speakingId === 'term-slow' ? 'var(--warning)' : 'var(--bg-tertiary)',
                                color: speakingId === 'term-slow' ? 'white' : 'var(--text-tertiary)',
                                border: 'none', borderRadius: 'var(--radius-full)',
                                width: '32px', height: '32px', padding: 0, fontSize: '0.85rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                            }}
                        >
                            🐢
                        </button>
                    </div>
                </div>

                {/* Usage Explanation */}
                <div style={{
                    padding: '1rem', background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)'
                }}>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {item.explicacao_uso}
                    </p>
                </div>

                {/* Examples */}
                <div className="flex-col gap-3">
                    <h4 className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Exemplos de uso
                    </h4>
                    {item.exemplos.map((ex, i) => {
                        const tipKey = `${currentIndex}-${i}`;
                        const isExpanded = expandedTips[tipKey] || false;

                        return (
                            <div key={i} className="card" style={{ padding: '0', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                {/* Example sentence + audio buttons */}
                                <div style={{ padding: '0.75rem 1rem' }}>
                                    <div className="flex-between" style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                                {ex.frase_ingles}
                                            </p>
                                            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                                {ex.traducao_frase}
                                            </p>
                                        </div>
                                        <div className="flex-col gap-1" style={{ alignItems: 'center' }}>
                                            <button
                                                onClick={() => handleSpeak(ex.frase_ingles, `ex-${i}`)}
                                                style={{
                                                    background: speakingId === `ex-${i}` ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                    color: speakingId === `ex-${i}` ? 'white' : 'var(--text-secondary)',
                                                    border: 'none', borderRadius: 'var(--radius-full)',
                                                    width: '36px', height: '36px', padding: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                                                }}
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleSpeak(ex.frase_ingles, `ex-${i}-slow`, 'slow')}
                                                title="Ouvir devagar"
                                                style={{
                                                    background: speakingId === `ex-${i}-slow` ? 'var(--warning)' : 'var(--bg-tertiary)',
                                                    color: speakingId === `ex-${i}-slow` ? 'white' : 'var(--text-tertiary)',
                                                    border: 'none', borderRadius: 'var(--radius-full)',
                                                    width: '28px', height: '28px', padding: 0, fontSize: '0.75rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                                                }}
                                            >
                                                🐢
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable: "Por Trás da Frase" */}
                                {(ex.estrutura || ex.dica_pronuncia) && (
                                    <>
                                        <button
                                            onClick={() => toggleTip(tipKey)}
                                            style={{
                                                width: '100%', padding: '0.5rem 1rem',
                                                background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
                                                borderTop: '1px solid var(--border-color)',
                                                border: 'none', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--border-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                                                color: 'var(--accent-primary)',
                                                transition: 'background 0.2s ease'
                                            }}
                                        >
                                            <BookOpen size={14} />
                                            Por Trás da Frase
                                            <ChevronDown size={14} style={{
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }} />
                                        </button>

                                        {isExpanded && (
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                background: 'var(--bg-tertiary)',
                                                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                                animation: 'fadeIn 0.2s ease'
                                            }}>
                                                {ex.estrutura && (
                                                    <div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            📐 Estrutura Gramatical
                                                        </p>
                                                        <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                                            {ex.estrutura}
                                                        </p>
                                                    </div>
                                                )}
                                                {ex.dica_pronuncia && (
                                                    <div>
                                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            🗣️ Dica de Pronúncia Nativa
                                                        </p>
                                                        <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                                            {ex.dica_pronuncia}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex-between mt-4" style={{ gap: '1rem' }}>
                <button
                    className="btn btn-secondary flex-1"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    style={{ height: '3.5rem', opacity: currentIndex === 0 ? 0.4 : 1 }}
                >
                    <ChevronLeft size={20} /> Anterior
                </button>
                <button
                    className="btn btn-primary flex-1"
                    onClick={handleNext}
                    style={{ height: '3.5rem', fontSize: '1.05rem' }}
                >
                    {isLast ? (
                        <><CheckCircle size={20} /> Concluir</>
                    ) : (
                        <>Próximo <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
