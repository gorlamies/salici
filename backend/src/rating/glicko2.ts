// Glicko-2 rating system (Mark Glickman, "Example of the Glicko-2 system", 2012).

// conversion factor between the Glicko scale (1500, 350) and the internal Glicko-2 scale
const SCALE = 173.7178;
const BASE_RATING = 1500;
// precision of the iterative computation of the volatility
const CONVERGENCE_TOLERANCE = 0.000001;

export type GlickoRating = {
    rating: number;
    deviation: number;
    volatility: number;
};

export type GameResult = {
    opponent: GlickoRating;
    // 1 win, 0.5 draw, 0 loss
    score: number;
};

/**
 * New rating of a player after some games (a "rating period").
 * The app calls it after every game, with a single result, as Lichess does.
 * @param player rating before the games
 * @param results the games of the period
 * @param tau how much the volatility can change (the paper suggests 0.3 - 1.2)
 */
export function updateRating(player: GlickoRating, results: GameResult[], tau: number): GlickoRating {
    // step 2: to the Glicko-2 scale
    const mu = (player.rating - BASE_RATING) / SCALE;
    const phi = player.deviation / SCALE;
    const sigma = player.volatility;

    if (results.length === 0) {
        // no games: only the uncertainty grows
        return {
            rating: player.rating,
            deviation: Math.sqrt(phi * phi + sigma * sigma) * SCALE,
            volatility: sigma,
        };
    }

    const opponents = results.map((result) => {
        const opponentMu = (result.opponent.rating - BASE_RATING) / SCALE;
        const opponentPhi = result.opponent.deviation / SCALE;
        const g = 1 / Math.sqrt(1 + (3 * opponentPhi * opponentPhi) / (Math.PI * Math.PI));
        // expected score against this opponent
        const expected = 1 / (1 + Math.exp(-g * (mu - opponentMu)));
        return { g, expected, score: result.score };
    });

    // step 3: estimated variance of the rating based only on the game outcomes
    const v = 1 / opponents.reduce((sum, o) => sum + o.g * o.g * o.expected * (1 - o.expected), 0);

    // step 4: estimated improvement
    const improvementSum = opponents.reduce((sum, o) => sum + o.g * (o.score - o.expected), 0);
    const delta = v * improvementSum;

    // step 5: new volatility (Illinois algorithm)
    const a = Math.log(sigma * sigma);
    const f = (x: number) => {
        const ex = Math.exp(x);
        const denominator = phi * phi + v + ex;
        return (ex * (delta * delta - phi * phi - v - ex)) / (2 * denominator * denominator) - (x - a) / (tau * tau);
    };

    let A = a;
    let B: number;
    if (delta * delta > phi * phi + v) {
        B = Math.log(delta * delta - phi * phi - v);
    } else {
        let k = 1;
        while (f(a - k * tau) < 0) k++;
        B = a - k * tau;
    }

    let fA = f(A);
    let fB = f(B);
    while (Math.abs(B - A) > CONVERGENCE_TOLERANCE) {
        const C = A + ((A - B) * fA) / (fB - fA);
        const fC = f(C);
        if (fC * fB <= 0) {
            A = B;
            fA = fB;
        } else {
            fA = fA / 2;
        }
        B = C;
        fB = fC;
    }
    const newSigma = Math.exp(A / 2);

    // steps 6 and 7: new deviation and rating
    const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);
    const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const newMu = mu + newPhi * newPhi * improvementSum;

    // step 8: back to the Glicko scale
    return {
        rating: newMu * SCALE + BASE_RATING,
        deviation: newPhi * SCALE,
        volatility: newSigma,
    };
}