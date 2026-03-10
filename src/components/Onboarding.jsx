import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSetting, addCard, getSetting } from '../db';
import { Globe, Target, Clock, CheckCircle } from 'lucide-react';

const INITIAL_DECKS = {
    beginner: [
        { type: 'Word', english: 'Hello', translation: 'Olá', example: 'Hello, how are you?', tags: ['basic', 'greeting'] },
        { type: 'Phrase', english: 'How are you?', translation: 'Como vai você?', example: 'Hi! How are you today?', tags: ['basic', 'greeting'] },
        { type: 'Word', english: 'Thanks', translation: 'Obrigado(a)', example: 'Thanks for your help.', tags: ['basic'] },
    ],
    intermediate: [
        { type: 'Phrase', english: 'To figure out', translation: 'Descobrir/Entender', example: 'I need to figure out how this works.', tags: ['phrasal verbs'] },
        { type: 'Phrase', english: 'By the way', translation: 'A propósito', example: 'By the way, did you finish the report?', tags: ['expression'] },
        { type: 'Word', english: 'Nevertheless', translation: 'Porém / No entanto', example: 'It was raining; nevertheless, we went for a walk.', tags: ['conjunction'] },
    ],
    work: [
        { type: 'Word', english: 'Deadline', translation: 'Prazo', example: 'The deadline for this project is Friday.', tags: ['business'] },
        { type: 'Phrase', english: 'To touch base', translation: 'Entrar em contato rápido', example: 'Let\'s touch base next week.', tags: ['business', 'idiom'] },
    ],
    travel: [
        { type: 'Word', english: 'Luggage', translation: 'Bagagem', example: 'Where can I claim my luggage?', tags: ['travel', 'airport'] },
        { type: 'Phrase', english: 'How much is it?', translation: 'Quanto custa?', example: 'How much is it for a ticket to New York?', tags: ['travel', 'shopping'] },
    ]
};

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [prefs, setPrefs] = useState({
        level: 'beginner',
        goal: 'general',
        accent: 'US',
        notificationTime: '09:00',
        intensity: 'normal'
    });

    // Redirect if already onboarded
    useEffect(() => {
        const checkOnboarded = async () => {
            const isConfigured = await getSetting('onboarded', false);
            if (isConfigured) navigate('/');
        };
        checkOnboarded();
    }, [navigate]);

    const handleFinish = async () => {
        await saveSetting('onboarded', true);
        await saveSetting('level', prefs.level);
        await saveSetting('goal', prefs.goal);
        await saveSetting('accent', prefs.accent);
        await saveSetting('daily_goal', 15);

        // Create initial deck
        let deckToLoad = [...INITIAL_DECKS[prefs.level]];
        if (prefs.goal === 'work' || prefs.goal === 'travel') {
            deckToLoad = [...deckToLoad, ...INITIAL_DECKS[prefs.goal]];
        }

        // Add cards one by one
        for (const card of deckToLoad) {
            await addCard({ ...card, difficulty: 3 });
        }

        navigate('/');
    };

    return (
        <div className="card" style={{ maxWidth: '100%', marginTop: '2rem' }}>
            <h2 className="text-gradient">Bem-vindo ao EngMaster</h2>
            <p className="text-secondary mt-2 mb-6">Vamos personalizar sua experiência.</p>

            {step === 1 && (
                <div className="flex-col gap-4">
                    <h3>Qual o seu nível de inglês?</h3>
                    <button
                        className={`btn ${prefs.level === 'beginner' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setPrefs({ ...prefs, level: 'beginner' }); setStep(2); }}
                    >
                        Iniciante
                    </button>
                    <button
                        className={`btn ${prefs.level === 'intermediate' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setPrefs({ ...prefs, level: 'intermediate' }); setStep(2); }}
                    >
                        Intermediário
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="flex-col gap-4">
                    <h3>Qual seu objetivo principal?</h3>
                    <div className="flex-col gap-2">
                        {[
                            { id: 'general', title: 'Geral / Conversação' },
                            { id: 'work', title: 'Trabalho / Negócios' },
                            { id: 'travel', title: 'Viagem / Turismo' }
                        ].map(g => (
                            <button
                                key={g.id}
                                className={`btn ${prefs.goal === g.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setPrefs({ ...prefs, goal: g.id })}
                            >
                                {g.title}
                            </button>
                        ))}
                    </div>
                    <div className="flex-between mt-4">
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                        <button className="btn btn-primary" onClick={() => setStep(3)}>Avançar</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="flex-col gap-4">
                    <h3>Preferências de Pronúncia</h3>
                    <div className="flex-between">
                        <button
                            className={`btn flex-1 ${prefs.accent === 'US' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => setPrefs({ ...prefs, accent: 'US' })}
                        >
                            Americano (US)
                        </button>
                        <button
                            className={`btn flex-1 ${prefs.accent === 'UK' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ marginLeft: '0.5rem' }}
                            onClick={() => setPrefs({ ...prefs, accent: 'UK' })}
                        >
                            Britânico (UK)
                        </button>
                    </div>

                    <div className="flex-between mt-8">
                        <button className="btn btn-secondary" onClick={() => setStep(2)}>Voltar</button>
                        <button className="btn btn-primary" onClick={handleFinish}>
                            <CheckCircle size={18} /> Começar!
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Dots */}
            <div className="flex-center gap-2 mt-8">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: step >= i ? 'var(--accent-primary)' : 'var(--border-color)'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
