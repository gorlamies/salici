import { TimeCategory } from "../generated/prisma/enums";

const ESTIMATED_MOVES_PER_GAME = 40;

// upper of the estimated duration in seconds
const BULLET_MAX_SECONDS = 180;
const BLITZ_MAX_SECONDS = 480;
const RAPID_MAX_SECONDS = 1500;

const UNLIMITED_LABEL = "∞";

export type TimeControlDescription = {
    timeCategory: TimeCategory;
    timeLabel: string;
};

/**
 * Describes a time control: its category (bullet, blitz, ...) and its label (e.g. "3+2").
 * This is the only place where the category of a time control is decided.
 * @param initialTimeMs initial time of each player, null for games without a clock
 * @param incrementMs increment per move, null for games without a clock
 * @returns the category and the label of the time control
 */
export function describeTimeControl(
    initialTimeMs: number | null,
    incrementMs: number | null,
): TimeControlDescription {
    if (initialTimeMs === null || incrementMs === null) {
        return {
            timeCategory: TimeCategory.unlimited,
            timeLabel: UNLIMITED_LABEL,
        };
    }

    const initialSeconds = initialTimeMs / 1000;
    const incrementSeconds = incrementMs / 1000;
    const estimatedSeconds =
        initialSeconds + ESTIMATED_MOVES_PER_GAME * incrementSeconds;

    let timeCategory: TimeCategory;
    if (estimatedSeconds < BULLET_MAX_SECONDS) {
        timeCategory = TimeCategory.bullet;
    } else if (estimatedSeconds < BLITZ_MAX_SECONDS) {
        timeCategory = TimeCategory.blitz;
    } else if (estimatedSeconds < RAPID_MAX_SECONDS) {
        timeCategory = TimeCategory.rapid;
    } else {
        timeCategory = TimeCategory.classical;
    }

    // max 2 decimals
    const minutesLabel = String(Number((initialTimeMs / 60000).toFixed(2)));
    const incrementLabel = String(Number(incrementSeconds.toFixed(2)));

    return {
        timeCategory,
        timeLabel: `${minutesLabel}+${incrementLabel}`,
    };
}
