// Glicko-2 values of a player who has never played in a time category.
// They must stay equal to the defaults of the Rating model in schema.prisma.
export const DEFAULT_RATING = 1500;
export const DEFAULT_DEVIATION = 350;

// above this deviation the rating is not reliable yet
export const PROVISIONAL_DEVIATION = 110;
export const DEFAULT_VOLATILITY = 0.06;

// Glicko-2 parameters
export const TAU = 0.75; // how much the volatility can change from game to game
export const MIN_DEVIATION = 45; // the deviation never goes below this value, so a rating can always still move