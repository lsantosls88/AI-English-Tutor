import { supabase } from './utils/supabase';
import { generateDailyCards } from './utils/ai';

// Helper to get the current user ID
export const getCurrentUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

// --- CARDS ---

export const addCard = async (cardData) => {
    const user_id = await getCurrentUserId();
    if (!user_id) throw new Error("Usuário não autenticado");

    const now = Date.now();
    const card = {
        ...cardData,
        user_id,
        created_at: now,
        next_review: now,
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0
    };

    const { data, error } = await supabase.from('cards').insert(card).select().single();
    if (error) throw error;
    return data;
};

export const getCardsToReview = async () => {
    const user_id = await getCurrentUserId();
    if (!user_id) return [];

    const now = Date.now();
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user_id)
        .lte('next_review', now);

    if (error) throw error;
    return data || [];
};

export const getAllCards = async () => {
    const user_id = await getCurrentUserId();
    if (!user_id) return [];

    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user_id);

    if (error) throw error;
    return data || [];
};

export const deleteCard = async (id) => {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw error;
};

export const updateCardReview = async (id, sm2Result) => {
    const { data, error } = await supabase.from('cards').update({
        next_review: sm2Result.nextReview,
        ease_factor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions
    }).eq('id', id).select().single();

    if (error) throw error;
    return data;
};

export const replaceCardsBatch = async (cardsList) => {
    const user_id = await getCurrentUserId();
    if (!user_id) throw new Error("Usuário não autenticado");

    // Add user_id to all cards before inserting
    const cardsWithUser = cardsList.map(card => {
        const { id, ...rest } = card; // remove old dexie IDs if any
        return { ...rest, user_id };
    });

    const { data, error } = await supabase.from('cards').insert(cardsWithUser);
    if (error) throw error;
    return data;
};

// --- STATS ---

export const getStatsForToday = async () => {
    const user_id = await getCurrentUserId();
    if (!user_id) return null;

    const date = new Date().toISOString().split('T')[0];
    const { data: stats, error } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', date)
        .maybeSingle();

    if (error) throw error;

    if (!stats) {
        const newStats = { user_id, date, new_cards: 0, reviews: 0, extra_reviews: 0, correct: 0, wrong: 0, streak_active: false };
        const { data: insertedData, error: insertError } = await supabase.from('stats').insert(newStats).select().single();
        if (insertError) throw insertError;
        return insertedData;
    }
    return stats;
};

export const updateStats = async (isCorrect, isExtra = false) => {
    const user_id = await getCurrentUserId();
    if (!user_id) return null;

    const stats = await getStatsForToday();
    if (!stats) return null;

    let updatePayload = {};

    if (isExtra) {
        updatePayload.extra_reviews = (stats.extra_reviews || 0) + 1;
    } else {
        if (isCorrect) {
            updatePayload.correct = (stats.correct || 0) + 1;
        } else {
            updatePayload.wrong = (stats.wrong || 0) + 1;
        }
        updatePayload.reviews = (stats.reviews || 0) + 1;
    }

    const { data, error } = await supabase
        .from('stats')
        .update(updatePayload)
        .eq('id', stats.id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- SETTINGS ---

export const getSetting = async (key, defaultValue) => {
    const user_id = await getCurrentUserId();
    if (!user_id) return defaultValue;

    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('user_id', user_id)
        .eq('key', key)
        .maybeSingle();

    if (error) throw error;
    return data ? data.value : defaultValue;
};

export const saveSetting = async (key, value) => {
    const user_id = await getCurrentUserId();
    if (!user_id) throw new Error("Usuário não autenticado");

    // Supabase has an upsert feature, but we need to ensure the unique constraint (user_id, key) matches
    const { data, error } = await supabase
        .from('settings')
        .upsert({ user_id, key, value }, { onConflict: 'user_id,key' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// --- AUTO DAILY CONTENT ---

/**
 * Checks if daily cards have already been generated today. If not, generates 3 new cards via AI.
 * Returns the newly created cards, or null if skipped/failed.
 */
export const addDailyCards = async () => {
    const user_id = await getCurrentUserId();
    if (!user_id) return null;

    // Check if we already generated today
    const today = new Date().toISOString().split('T')[0];
    const lastGenDate = await getSetting('last_auto_generate_date', '');

    if (lastGenDate === today) {
        return null; // Already generated today
    }

    // Get user preferences
    const level = await getSetting('level', 'beginner');
    const goal = await getSetting('goal', 'general');

    // Get existing words to avoid duplicates
    const allCards = await getAllCards();
    const existingWords = allCards.map(c => c.english);

    // Call the AI
    const newCards = await generateDailyCards(level, goal, existingWords);

    if (!newCards || newCards.length === 0) {
        return null; // AI not configured or failed
    }

    // Save each card
    const savedCards = [];
    for (const card of newCards) {
        try {
            const saved = await addCard(card);
            savedCards.push(saved);
        } catch (err) {
            console.error("Error saving daily card:", err);
        }
    }

    // Mark today as done
    if (savedCards.length > 0) {
        await saveSetting('last_auto_generate_date', today);
    }

    return savedCards;
};
