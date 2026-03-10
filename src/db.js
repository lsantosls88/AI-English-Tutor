import Dexie from 'dexie';

export const db = new Dexie('EngMasterDB');

db.version(2).stores({
    cards: '++id, type, english, tags, created_at, next_review',
    notes: '++id, title, tags, updated_at',
    stats: 'date',
    settings: 'key'
}).upgrade(tx => {
    // Add extra_reviews if it didn't exist
    return tx.table('stats').toCollection().modify(stat => {
        if (stat.extra_reviews === undefined) stat.extra_reviews = 0;
    });
});

// Helper functions for common database operations

export const addCard = async (cardData) => {
    const now = Date.now();
    const card = {
        ...cardData, // type, english, translation, example, difficulty, notes, tags
        created_at: now,
        // SM-2 fields
        next_review: now, // Ready to review immediately
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0
    };
    return await db.cards.add(card);
};

export const getCardsToReview = async () => {
    const now = Date.now();
    return await db.cards
        .where('next_review')
        .belowOrEqual(now)
        .toArray();
};

export const updateCardReview = async (id, sm2Result) => {
    return await db.cards.update(id, {
        next_review: sm2Result.nextReview,
        ease_factor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions
    });
};

export const getStatsForToday = async () => {
    const date = new Date().toISOString().split('T')[0];
    let stats = await db.stats.get(date);
    if (!stats) {
        stats = { date, new_cards: 0, reviews: 0, extra_reviews: 0, correct: 0, wrong: 0, streak_active: false };
        await db.stats.add(stats);
    }
    return stats;
};

export const updateStats = async (isCorrect, isExtra = false) => {
    const date = new Date().toISOString().split('T')[0];
    const stats = await getStatsForToday();

    if (isExtra) {
        stats.extra_reviews = (stats.extra_reviews || 0) + 1;
    } else {
        if (isCorrect) {
            stats.correct += 1;
        } else {
            stats.wrong += 1;
        }
        stats.reviews += 1;
    }

    await db.stats.put(stats);
    return stats;
};

export const getSetting = async (key, defaultValue) => {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
};

export const saveSetting = async (key, value) => {
    return await db.settings.put({ key, value });
};
