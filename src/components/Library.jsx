import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { exportToCSV, downloadCSV, importFromCSV } from '../utils/csv';
import { Download, Upload, Search, Trash2 } from 'lucide-react';

export default function Library() {
    const [searchTerm, setSearchTerm] = useState('');

    // Use Dexie's live query to automatically re-render when cards change
    const allCards = useLiveQuery(() => db.cards.toArray(), []) || [];

    const filteredCards = allCards.filter(card =>
        card.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.translation && card.translation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleDelete = async (id) => {
        if (window.confirm("Certeza que deseja excluir este card?")) {
            await db.cards.delete(id);
        }
    };

    const handleExport = async () => {
        const csv = await exportToCSV();
        if (csv) {
            downloadCSV(csv, `english_tutor_${new Date().toISOString().split('T')[0]}.csv`);
        } else {
            alert("Nenhum card para exportar.");
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const contents = e.target.result;
            const count = await importFromCSV(contents);
            alert(`Foram importados ${count} cards com sucesso!`);
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex-col gap-4">
            <div className="flex-between mb-2">
                <h2>Biblioteca</h2>
                <span className="badge text-secondary bg-tertiary">{allCards.length} cards</span>
            </div>

            <div className="card p-4">
                <div className="flex-between gap-4">
                    <button className="btn btn-secondary flex-1" onClick={handleExport}>
                        <Download size={18} /> Exportar
                    </button>

                    <label className="btn btn-secondary flex-1 cursor-pointer">
                        <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                        <Upload size={18} /> Importar
                    </label>
                </div>

                <div style={{ position: 'relative', width: '100%', marginTop: '1rem' }}>
                    <Search size={18} className="text-tertiary" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        className="input w-full"
                        placeholder="Pesquisar cards..."
                        style={{ paddingLeft: '2.5rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-col gap-3 mt-4">
                {filteredCards.length > 0 ? (
                    filteredCards.map(card => (
                        <div key={card.id} className="card flex-between" style={{ padding: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{card.english}</span>
                                    <span className="badge bg-tertiary text-xs" style={{ background: 'var(--bg-tertiary)' }}>{card.type}</span>
                                </div>
                                <p className="text-secondary text-sm mt-1">{card.translation || <span className="italic">Sem tradução</span>}</p>
                                {card.tags && card.tags.length > 0 && (
                                    <div className="flex mt-2 gap-1 text-xs">
                                        {card.tags.map(tag => (
                                            <span key={tag} style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(card.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-secondary">
                        <p>Nenhum card encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
