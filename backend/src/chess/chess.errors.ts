export class InvalidFenError extends Error {
    constructor(message = "The provided FEN is not valid.") {
        super(message);
        this.name = "InvalidFenError";
    }
}

export class IllegalMoveError extends Error {
    constructor(message = "The requested move is not legal.") {
        super(message);
        this.name = "IllegalMoveError";
    }
}

export class InvalidMoveHistoryError extends Error {
    constructor(message = "The stored move history is not valid.") {
        super(message);
        this.name = "InvalidMoveHistoryError";
    }
}