import { Box, Typography } from "@mui/material";
import type { Move } from "../api/games";

interface MoveHistoryProps {
  moves: Move[];
}

interface MovePair {
  number: number;
  white?: Move;
  black?: Move;
}

function groupMovesIntoPairs(moves: Move[]): MovePair[] {
  const pairs: MovePair[] = [];

  for (const move of moves) {
    const isWhiteMove = move.moveNumber % 2 === 1;
    const pairNumber = Math.ceil(move.moveNumber / 2);
    const pairIndex = pairNumber - 1;

    if (!pairs[pairIndex]) {
      pairs[pairIndex] = { number: pairNumber };
    }

    if (isWhiteMove) {
      pairs[pairIndex].white = move;
    } else {
      pairs[pairIndex].black = move;
    }
  }

  return pairs;
}

function MoveHistory({ moves }: MoveHistoryProps) {
  const pairs = groupMovesIntoPairs(moves);

  return (
    <Box
      sx={{
        minWidth: 180,
        maxHeight: 560,
        overflowY: "auto",
        border: "1px solid #ccc",
        borderRadius: 1,
        p: 1,
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        moves
      </Typography>
      {pairs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          no moves yet.
        </Typography>
      ) : (
        pairs.map((pair) => (
          <Box key={pair.number} sx={{ display: "flex", gap: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 24, color: "text.secondary" }}>
              {pair.number}.
            </Typography>
            <Typography variant="body2" sx={{ minWidth: 48 }}>
              {pair.white ? pair.white.san : ""}
            </Typography>
            <Typography variant="body2" sx={{ minWidth: 48 }}>
              {pair.black ? pair.black.san : ""}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
}

export default MoveHistory;