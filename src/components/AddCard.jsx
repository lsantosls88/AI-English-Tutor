import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCard } from '../db';
import { CheckCircle, Zap, Sparkles } from 'lucide-react';
import { generateCardData } from '../utils/ai';

export default function AddCard() {
    const navigate = useNavigate();
    const [type, setType] = useState('Word');
    const [english, setEnglish] = useState('');
    const [translation, setTranslation] = useState('');
    const [example, setExample] = useState('');
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState('');
    const [difficulty, setDifficulty] = useState(3);

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAI = async (e) => {
        e.preventDefault();
        if (!english.trim()) return;

        setIsGenerating(true);
        try {
            const data = await generateCardData(english.trim());
            // Only overwrite if the AI returned something
            if (data.translation) setTranslation(data.translation);
            if (data.example) setExample(data.example);
            if (data.notes) setNotes(data.notes);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!english.trim()) return;

        setIsSaving(true);

        // Parse tags safely
        const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

        await addCard({
            type,
            english: english.trim(),
            translation: translation.trim(),
            example: example.trim(),
            notes: notes.trim(),
            tags: parsedTags,
            difficulty
        });

        // Reset form
        setEnglish('');
        setTranslation('');
        setExample('');
        setNotes('');
        setTags('');
        setDifficulty(3);
        setIsSaving(false);

        // Show a small toast or just navigate? Just stay for adding more
        alert('Card salvo com sucesso!');
    };

    return (
        <div className="card">
            <h2 className="text-gradient mb-6 text-center">Adicionar {type === 'Word' ? 'Palavra' : 'Frase'}</h2>

            <div className="flex-center mb-6" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', padding: '0.25rem' }}>
                <button
                    className="flex-1"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: type === 'Word' ? 'var(--bg-secondary)' : 'transparent',
                        boxShadow: type === 'Word' ? 'var(--shadow-sm)' : 'none',
                        fontWeight: type === 'Word' ? '600' : '500',
                        transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => setType('Word')}
                >
                    Palavra
                </button>
                <button
                    className="flex-1"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: type === 'Phrase' ? 'var(--bg-secondary)' : 'transparent',
                        boxShadow: type === 'Phrase' ? 'var(--shadow-sm)' : 'none',
                        fontWeight: type === 'Phrase' ? '600' : '500',
                        transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => setType('Phrase')}
                >
                    Frase
                </button>
            </div>

            <form onSubmit={handleSave} className="flex-col gap-4">
                <div>
                    <label className="text-secondary text-sm font-semibold mb-1 block">Inglês *</label>
                    <div className="flex-col gap-2">
                        <input
                            type="text"
                            className="input-field"
                            placeholder={type === 'Word' ? "Ex: Approach" : "Ex: To look forward to"}
                            value={english}
                            onChange={(e) => setEnglish(e.target.value)}
                            required
                            autoFocus
                        />
                        <button
                            type="button"
                            className="btn btn-secondary w-full"
                            style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-primary)', borderColor: 'var(--accent-light)', background: 'var(--accent-light)' }}
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !english.trim()}
                        >
                            <Sparkles size={16} className={isGenerating ? "animate-pulse" : ""} />
                            {isGenerating ? "Gerando Mágica IA..." : "Gerar Tradução e Exemplo com IA"}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-secondary text-sm font-semibold mb-1 block">Tradução (opcional)</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Ex: Abordagem / Aproximar-se"
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-secondary text-sm font-semibold mb-1 block">Exemplo de Uso (opcional)</label>
                    <textarea
                        className="input-field"
                        placeholder="Ex: We need a new approach to this problem."
                        rows={3}
                        value={example}
                        onChange={(e) => setExample(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-secondary text-sm font-semibold mb-1 block">Dica do Tutor IA (opcional)</label>
                    <textarea
                        className="input-field"
                        placeholder="Dica de pronúncia ou uso (Gerada via IA ou sua)"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ borderLeft: '3px solid var(--accent-primary)' }}
                    />
                </div>

                <div>
                    <label className="text-secondary text-sm font-semibold mb-1 block">Tags (separadas por vírgula)</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Ex: trabalho, phrasal_verbs, viagem"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-secondary text-sm font-semibold mb-2 flex-between">
                        <span>Dificuldade (1-5)</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{difficulty}</span>
                    </label>
                    <input
                        type="range"
                        min="1" max="5"
                        value={difficulty}
                        onChange={(e) => setDifficulty(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                    <div className="flex-between text-xs text-tertiary mt-1">
                        <span>Fácil</span>
                        <span>Difícil</span>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary mt-4" disabled={isSaving || !english.trim()} style={{ width: '100%', fontSize: '1.1rem', height: '3.5rem' }}>
                    {isSaving ? 'Salvando...' : <><CheckCircle size={20} /> Salvar Card</>}
                </button>
            </form>
        </div>
    );
}
