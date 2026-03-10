import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../db';
import { Moon, Sun, Volume2, Target, RotateCcw } from 'lucide-react';

export default function Settings() {
    const [theme, setTheme] = useState('light');
    const [accent, setAccent] = useState('US');
    const [dailyGoal, setDailyGoal] = useState(15);
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const t = await getSetting('theme', 'dark');
            const a = await getSetting('accent', 'US');
            const g = await getSetting('daily_goal', 15);
            const key = await getSetting('gemini_api_key', '');

            setTheme(t);
            setAccent(a);
            setDailyGoal(g);
            setApiKey(key);

            // Setup initial visual theme
            document.documentElement.setAttribute('data-theme', t);
        };
        loadSettings();
    }, []);

    const handleSave = async (key, value) => {
        setSaving(true);
        await saveSetting(key, value);

        if (key === 'theme') {
            setTheme(value);
            document.documentElement.setAttribute('data-theme', value);
        } else if (key === 'accent') {
            setAccent(value);
        } else if (key === 'daily_goal') {
            setDailyGoal(value);
        }

        setTimeout(() => setSaving(false), 300);
    };

    const handleReset = async () => {
        if (window.confirm("Deseja mesmo redefinir TODAS as estatísticas e histórico do app? (Os cards e anotações NÃO serão apagados)")) {
            // In a real scenario, truncate specific tables like stats / reviews history
            alert("Apenas representativo (Não implementado). Para apagar de verdade, vá no DevTools > Application > IndexedDB.");
        }
    };

    return (
        <div className="flex-col gap-6">
            <h2>Configurações</h2>

            <div className="card">
                <h3 className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <Sun size={18} /> Aparência (Tema)
                </h3>
                <div className="flex-between gap-4">
                    <button
                        className={`btn flex-1 ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSave('theme', 'light')}
                    >
                        Claro
                    </button>
                    <button
                        className={`btn flex-1 ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSave('theme', 'dark')}
                    >
                        Escuro
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <Volume2 size={18} /> Sotaque da Pronúncia (TTS)
                </h3>
                <div className="flex-between gap-4">
                    <button
                        className={`btn flex-1 ${accent === 'US' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSave('accent', 'US')}
                    >
                        Estados Unidos
                    </button>
                    <button
                        className={`btn flex-1 ${accent === 'UK' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleSave('accent', 'UK')}
                    >
                        Reino Unido
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <Target size={18} /> Meta Diária (Cards)
                </h3>
                <div className="flex-between">
                    <input
                        type="range"
                        min="5" max="50" step="5"
                        value={dailyGoal}
                        onChange={(e) => handleSave('daily_goal', parseInt(e.target.value))}
                        style={{ width: '70%', accentColor: 'var(--accent-primary)' }}
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                        {dailyGoal}
                    </span>
                </div>
            </div>

            <div className="card">
                <h3 className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>✨</span> Tutor IA (Google Gemini)
                </h3>
                <p className="text-secondary text-sm mb-4">
                    Insira sua chave de API do Google Gemini para habilitar explicações automáticas de gramática e dicas de pronúncia nativa ao criar cards.
                </p>
                <div className="flex-col gap-2">
                    <input
                        type="password"
                        className="input-field"
                        placeholder="Cole sua API Key aqui..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button className="btn btn-secondary mt-2" onClick={() => handleSave('gemini_api_key', apiKey)}>
                        Salvar Chave
                    </button>
                </div>
            </div>

            <div className="card mt-4" style={{ border: '1px solid var(--danger-light)' }}>
                <h3 className="text-danger mb-2" style={{ fontSize: '1rem' }}>Zona de Perigo</h3>
                <p className="text-xs text-secondary mb-4">Redefinir o progresso apaga suas estatísticas e agendamentos de revisão (SM-2), forçando os cards a começarem do zero.</p>
                <button className="btn w-full" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleReset}>
                    <RotateCcw size={18} /> Redefinir Progresso
                </button>
            </div>

            {saving && <p className="text-center text-xs text-secondary mt-2">Salvando preferência...</p>}

            <p className="text-center text-xs text-tertiary mt-8">EngMaster v1.0.0</p>
        </div>
    );
}
