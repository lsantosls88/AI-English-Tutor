import { getAllCards, addCard } from '../db';

/**
 * Generates a CSV string from an array of cards
 */
export const exportToCSV = async () => {
    const cards = await getAllCards();

    if (cards.length === 0) return null;

    const header = ['Type', 'English', 'Translation', 'Example', 'Tags', 'Difficulty'];

    const rows = cards.map(card => {
        return [
            card.type || 'Word',
            `"${(card.english || '').replace(/"/g, '""')}"`,
            `"${(card.translation || '').replace(/"/g, '""')}"`,
            `"${(card.example || '').replace(/"/g, '""')}"`,
            `"${(card.tags ? card.tags.join(',') : '')}"`,
            card.difficulty || '3'
        ].join(',');
    });

    const csvString = [header.join(','), ...rows].join('\n');
    return csvString;
};

/**
 * Downloads a string as a file
 */
export const downloadCSV = (csvString, filename = 'english_tutor_backup.csv') => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Parses a basic CSV string and adds to database
 * Expects columns roughly in order: Type, English, Translation, Example, Tags, Difficulty
 * Can fallback gracefully if headers are different but basic structure is found.
 */
export const importFromCSV = async (csvString) => {
    if (!csvString) return 0;

    // Simple regex parser for CSV handling quotes
    const lines = csvString.split(/\r?\n/);
    if (lines.length < 2) return 0;

    let importedCount = 0;

    // Assuming first line is header, skip it
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma, respecting quotes
        const matches = line.match(/(?:"(?:[^"]|"")*"|[^,]*)(?=,|$)/g);
        if (!matches || matches.length < 2) continue;

        const unquote = (val) => {
            if (!val) return '';
            if (val.startsWith('"') && val.endsWith('"')) {
                return val.slice(1, -1).replace(/""/g, '"');
            }
            return val;
        };

        const type = unquote(matches[0]);
        const english = unquote(matches[1]);
        const translation = matches.length > 2 ? unquote(matches[2]) : '';
        const example = matches.length > 3 ? unquote(matches[3]) : '';
        const tagsStr = matches.length > 4 ? unquote(matches[4]) : '';
        const difficultyStr = matches.length > 5 ? unquote(matches[5]) : '3';

        if (english) {
            await addCard({
                type: type || 'Word',
                english,
                translation,
                example,
                tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
                difficulty: parseInt(difficultyStr, 10) || 3
            });
            importedCount++;
        }
    }

    return importedCount;
};
