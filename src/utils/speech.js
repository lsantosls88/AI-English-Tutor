// Web Speech API Utilities

// Helper to get the best voice
const getBestVoice = (accent) => {
    const voices = window.speechSynthesis.getVoices();
    const langQuery = accent === 'UK' ? 'en-GB' : 'en-US';

    // 1. Try to find a Neural voice in the correct language
    let best = voices.find(v => v.lang.includes(langQuery) && (v.name.includes('Neural') || v.name.includes('Natural')));

    // 2. Fallback to Google voices (usually better quality than default OS voices)
    if (!best) {
        best = voices.find(v => v.lang.includes(langQuery) && v.name.includes('Google'));
    }

    // 3. Fallback to any voice in the language
    if (!best) {
        best = voices.find(v => v.lang.includes(langQuery));
    }

    return best;
};

let currentSpeechId = 0; // To prevent overlapping chunked speeches

export const speak = async (text, accent = 'US', speed = 'normal', onEnd = null) => {
    if (!('speechSynthesis' in window)) {
        console.warn("Text-to-speech not supported in this browser.");
        if (onEnd) onEnd();
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    currentSpeechId++;
    const mySpeechId = currentSpeechId;

    // Split text by punctuation to insert processing pauses (0.5s)
    const parts = text.split(/([.,;?!]+)/);

    const playChunk = (chunkText) => {
        return new Promise((resolve) => {
            if (!chunkText.trim() || mySpeechId !== currentSpeechId) { resolve(); return; }

            const utterance = new SpeechSynthesisUtterance(chunkText);
            const voice = getBestVoice(accent);
            if (voice) utterance.voice = voice;
            else utterance.lang = accent === 'UK' ? 'en-GB' : 'en-US';

            // Configure speed (Natural-adjusted rhythm)
            if (speed === 'slow') utterance.rate = 0.6;
            else if (speed === 'fast') utterance.rate = 1.1;
            else utterance.rate = 0.90; // Natural rhythm, not robotic

            utterance.onend = resolve;
            utterance.onerror = resolve;
            window.speechSynthesis.speak(utterance);
        });
    };

    for (let i = 0; i < parts.length; i++) {
        if (mySpeechId !== currentSpeechId) break; // Was cancelled

        const part = parts[i];
        if (/^[.,;?!]+$/.test(part)) {
            // It's a punctuation mark, add 0.5s processing pause
            await new Promise(r => setTimeout(r, 500));
        } else if (part.trim().length > 0) {
            // It's text, speak it
            await playChunk(part);
        }
    }

    if (mySpeechId === currentSpeechId && onEnd) {
        onEnd();
    }
};

export const speakLearningMode = async (text, accent = 'US') => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Helper to wrap speak in a promise
    const speakPromise = (textToSpeak, speed) => {
        return new Promise((resolve) => {
            speak(textToSpeak, accent, speed, resolve);
        });
    };

    // 1. Speak normally
    await speakPromise(text, 'normal');

    // Small pause
    await new Promise(r => setTimeout(r, 600));

    // 2. Speak slowly, word by word
    // We achieve the "spaced words" effect simply by feeding words sequentially
    // The Web Speech API handles the queuing naturally.
    const words = text.split(/\s+/);
    for (const word of words) {
        // Strip out some heavy punctuation that might confuse isolated pronunciation
        const cleanWord = word.replace(/[.,;?!]/g, "");
        if (cleanWord) {
            await speakPromise(cleanWord, 'slow');
            await new Promise(r => setTimeout(r, 400)); // Pause between words
        }
    }

    await new Promise(r => setTimeout(r, 800));

    // 3. Speak normally again
    await speakPromise(text, 'normal');
};

export const startListening = (onResult, onError, language = 'en-US') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (onError) onError("Speech Recognition not supported in this browser.");
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
    };

    recognition.onerror = (event) => {
        if (onError) onError(event.error);
    };

    recognition.start();

    return recognition; // Return instance so it can be stopped manually if needed
};

// Simple diffing helper for pronunciation practice
// Highlights words that user missed or said wrong
export const comparePronunciation = (expected, actual) => {
    const sanitize = (str) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    const expectedWords = sanitize(expected).split(/\s+/);
    const actualWords = sanitize(actual).split(/\s+/);

    // Simple check: how many words matched?
    let matchCount = 0;
    expectedWords.forEach(word => {
        if (actualWords.includes(word)) matchCount++;
    });

    const accuracy = expectedWords.length > 0 ? (matchCount / expectedWords.length) * 100 : 0;

    return {
        accuracy,
        expectedWords,
        actualWords,
        isPerfect: accuracy === 100
    };
};
