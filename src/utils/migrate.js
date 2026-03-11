import Dexie from 'dexie';
import { supabase } from './supabase';
import { getCurrentUserId } from '../db';

// Temporary migration utility to move Dexie Local DB to Supabase Cloud
export const migrateLocalDataToCloud = async () => {
    try {
        const user_id = await getCurrentUserId();
        if (!user_id) throw new Error("Você precisa estar logado para migrar os dados.");

        const localDb = new Dexie('EngMasterDB');
        localDb.version(2).stores({
            cards: '++id, type, english, tags, created_at, next_review',
            notes: '++id, title, tags, updated_at',
            stats: 'date',
            settings: 'key'
        });

        let migratedCards = 0;
        let migratedNotes = 0;

        // 1. Migrate Cards
        const localCards = await localDb.cards.toArray();
        if (localCards.length > 0) {
            const cardsToInsert = localCards.map(c => {
                const { id, ...rest } = c; // Remove local ID, let Supabase generate UUID
                return { ...rest, user_id };
            });
            
            const { error } = await supabase.from('cards').insert(cardsToInsert);
            if (error) throw error;
            migratedCards = localCards.length;
        }

        // 2. Migrate Notes
        const localNotes = await localDb.notes.toArray();
        if (localNotes.length > 0) {
            const notesToInsert = localNotes.map(n => {
                const { id, ...rest } = n;
                return { ...rest, user_id };
            });
            
            const { error } = await supabase.from('notes').insert(notesToInsert);
            if (error) throw error;
            migratedNotes = localNotes.length;
        }

        // Return stats
        return { success: true, cards: migratedCards, notes: migratedNotes };

    } catch (error) {
        console.error("Migration error:", error);
        return { success: false, error: error.message };
    }
};
