import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getCurrentUserId } from '../db';
import { Plus, Trash2, PenTool } from 'lucide-react';

export default function Notes() {
    const [activeNote, setActiveNote] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState([]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            const user_id = await getCurrentUserId();
            if (!user_id) return;

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', user_id)
                .order('updated_at', { ascending: false });

            if (!error && data) {
                setNotes(data);
            }
        };
        fetchNotes();
    }, []);

    const handleCreate = async () => {
        const user_id = await getCurrentUserId();
        if (!user_id) return;

        const newNote = {
            user_id,
            title: 'Nova Anotação',
            content: '',
            tags: [],
            updated_at: Date.now()
        };

        const { data, error } = await supabase.from('notes').insert(newNote).select().single();

        if (!error && data) {
            setNotes([data, ...notes]);
            setActiveNote(data);
            setTitle(data.title);
            setContent(data.content);
            setTags('');
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!activeNote) return;

        const updatedNote = {
            title,
            content,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            updated_at: Date.now()
        };

        const { data, error } = await supabase
            .from('notes')
            .update(updatedNote)
            .eq('id', activeNote.id)
            .select()
            .single();

        if (!error && data) {
            setNotes(notes.map(n => n.id === activeNote.id ? data : n));
            setActiveNote(data);
            setIsEditing(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Apagar esta anotação?")) {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (!error) {
                setNotes(notes.filter(n => n.id !== id));
                if (activeNote && activeNote.id === id) {
                    setActiveNote(null);
                    setIsEditing(false);
                }
            }
        }
    };

    const openNote = (n) => {
        setActiveNote(n);
        setTitle(n.title);
        setContent(n.content || '');
        setTags(n.tags ? n.tags.join(', ') : '');
        setIsEditing(false);
    };

    if (activeNote && isEditing) {
        return (
            <div className="flex-col gap-4 h-full" style={{ minHeight: '80vh' }}>
                <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'transparent', border: 'none', padding: 0 }}
                    placeholder="Título da Anotação"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <input
                    type="text"
                    className="input-field mb-2 text-sm"
                    style={{ padding: '0.5rem', background: 'var(--bg-tertiary)' }}
                    placeholder="Tags (separadas por vírgula)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />

                <textarea
                    className="input-field flex-1"
                    style={{ minHeight: '300px', resize: 'vertical' }}
                    placeholder="Escreva suas anotações, regras de gramática, frases soltas..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex-between mt-auto">
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
                </div>
            </div>
        );
    }

    if (activeNote && !isEditing) {
        return (
            <div className="flex-col gap-4">
                <button className="btn-secondary" style={{ width: 'fit-content', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }} onClick={() => setActiveNote(null)}>
                    &larr; Voltar
                </button>

                <h2 style={{ fontSize: '1.8rem', marginTop: '1rem' }}>{activeNote.title}</h2>

                {activeNote.tags && activeNote.tags.length > 0 && (
                    <div className="flex gap-2">
                        {activeNote.tags.map(tag => (
                            <span key={tag} className="badge bg-tertiary text-secondary">{tag}</span>
                        ))}
                    </div>
                )}

                <div className="card mt-4 p-6" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {activeNote.content || <span className="text-tertiary italic">Anotação vazia.</span>}
                </div>

                <button className="btn btn-primary mt-4" style={{ width: '100%' }} onClick={() => setIsEditing(true)}>
                    <PenTool size={18} /> Editar Anotação
                </button>
            </div>
        );
    }

    return (
        <div className="flex-col gap-4">
            <div className="flex-between mb-4">
                <h2>Anotações</h2>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleCreate}>
                    <Plus size={18} /> Nova
                </button>
            </div>

            <div className="flex-col gap-3">
                {notes.length > 0 ? (
                    notes.sort((a, b) => b.updated_at - a.updated_at).map(n => (
                        <div key={n.id} className="card p-4 flex-between cursor-pointer" onClick={() => openNote(n)}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <h3 className="font-semibold text-lg truncate" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {n.title}
                                </h3>
                                <p className="text-sm text-secondary truncate mt-1" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {n.content || '...'}
                                </p>
                                <div className="text-xs text-tertiary mt-2">
                                    {new Date(n.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                            <button className="btn-icon text-danger ml-4" onClick={(e) => handleDelete(n.id, e)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-secondary">
                        <PenTool size={48} className="mx-auto mb-4 opacity-50 text-tertiary" />
                        <p>Seu caderno está vazio.</p>
                        <p className="text-sm mt-2">Crie anotações para dicas de gramática, dúvidas, ou textos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
