// Glicko-2 values of a player who has never played in a time category.
// They must stay equal to the defaults of the Rating model in schema.prisma.
export const DEFAULT_RATING = 1500;
export const DEFAULT_DEVIATION = 350;

// above this deviation the rating is not reliable yet
export const PROVISIONAL_DEVIATION = 110;