/**
 * Modified SM-2 Algorithm based on Anki's 4 buttons
 * 
 * Quality maps to buttons:
 * 0: Again / Wrong (Reset)
 * 3: Hard
 * 4: Good
 * 5: Easy
 */
export function calculateSM2(quality, repetitions, previousInterval, previousEaseFactor) {
    let easeFactor = previousEaseFactor;
    let interval = 0;

    if (quality < 3) { // Wrong / Again
        repetitions = 0;
        interval = 1; // Review tomorrow
    } else {
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(previousInterval * easeFactor);

            // Bonus interval for "Easy"
            if (quality === 5) {
                interval = Math.round(interval * 1.3);
            }
        }

        // Adjust ease factor
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        if (easeFactor < 1.3) easeFactor = 1.3;
        if (easeFactor > 3.0) easeFactor = 3.0; // Upper bound to prevent infinite scaling

        repetitions += 1;
    }

    // Create start of day for accurate interval calculations
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    nextReviewDate.setHours(0, 0, 0, 0); // Reset time to midnight of the target day

    return {
        interval,
        repetitions,
        easeFactor,
        nextReview: nextReviewDate.getTime()
    };
}
