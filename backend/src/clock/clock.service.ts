import {
    Injectable,
} from "@nestjs/common";

@Injectable()
export class ClockService {

    /** Calculate how much time the player has to make its first move.
     * @param initialTimeMs initial time
     * @param incrementMs increment
     * 
    */
    firstMoveAllowedMs(initialTimeMs: number, incrementMs: number): number {
        const expectedDuration = initialTimeMs + 40 * incrementMs;
        return Math.floor(expectedDuration / 10);
    }

    /**
    * Calculate the remaining time given the actual time and the time at which the turn started.
    * @param remainingMs the time left at the player
    * @param now the actual time
    * @param turnStartedAt Ms at which the turn started
    * @returns the remaining time
    */
    remainingTime(remainingMs: number, now: number, turnStartedAt: number): number {
        return Math.max(0, remainingMs - (now - turnStartedAt));
    }

    /**
    * Calculate the remaining time given the actual time, the time at which the turn started and if the game is in its initial phase.
    * @param remainingMs the time left at the player
    * @param now the actual time
    * @param turnStartedAt Ms at which the turn started
    * @param incrementMs increment
    * @param readyPhase true if the clock is still frozen because it is the first move of that player
    * @returns the remaining time
    */
    msLeftAfterMove(remainingMs: number, now: number, turnStartedAt: number, incrementMs: number, readyPhase: boolean): number {
        if (readyPhase)
            return remainingMs;
        remainingMs = this.remainingTime(remainingMs, now, turnStartedAt);
        if (remainingMs <= 0)
            return 0;
        return remainingMs + incrementMs;
    }

    /**
    * Calculate how much time is left before the next event starts (e.g.: aborted game if ready phase, losing on time on running phase)
    * @param remainingMs the time left at the player
    * @param initialTimeMs initial time
    * @param now the actual time
    * @param turnStartedAt Ms at which the turn started
    * @param incrementMs increment
    * @param readyPhase true if the clock is still frozen because it is the first move of that player
    * @returns the remaining time
    */
    msLeftBeforeEvent(remainingMs: number, now: number, turnStartedAt: number, initialTimeMs: number, incrementMs: number, readyPhase: boolean): number {
        if (readyPhase)
            return turnStartedAt + this.firstMoveAllowedMs(initialTimeMs, incrementMs) - now;
        return this.remainingTime(remainingMs, now, turnStartedAt);
    }

}
