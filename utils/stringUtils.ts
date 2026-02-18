
export const levenshteinDistance = (s: string, t: string): number => {
    if (s === t) return 0;
    if (s.length === 0) return t.length;
    if (t.length === 0) return s.length;

    // Create two rows for the matrix (memory optimization)
    let v0 = new Array(t.length + 1);
    let v1 = new Array(t.length + 1);

    // Initialize v0 (the previous row of distances)
    for (let i = 0; i <= t.length; i++) {
        v0[i] = i;
    }

    for (let i = 0; i < s.length; i++) {
        // Calculate v1 (current row distances) from the previous row v0

        // first element of v1 is A[i+1][0]
        v1[0] = i + 1;

        // Use formula to fill in the rest of the row
        for (let j = 0; j < t.length; j++) {
            const cost = s[i] === t[j] ? 0 : 1;
            v1[j + 1] = Math.min(
                v1[j] + 1,       // Deletion
                v0[j + 1] + 1,   // Insertion
                v0[j] + cost     // Substitution
            );
        }

        // Copy v1 (current row) to v0 (previous row) for next iteration
        for (let j = 0; j <= t.length; j++) {
            v0[j] = v1[j];
        }
    }

    return v1[t.length];
};
