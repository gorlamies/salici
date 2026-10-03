const sounds = {
    move: new Audio("/sounds/move.mp3"),
    capture: new Audio("/sounds/capture.mp3"),
};

export type SoundType = keyof typeof sounds;

export function playSound(type: SoundType) {
    const audio = sounds[type];

    audio.currentTime = 0;
    audio.play().catch((error) => {
        console.error("Audio error:", error);
    });
}