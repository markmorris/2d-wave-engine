/*************************************************
 * sound.js - Manage all game audio in one place
 *************************************************/

// Example file paths—change them to match your project
const shootSfxPath = 'assets/sounds/shoot.wav';
const damageSfxPath = 'assets/sounds/damage.wav';
const bgMusicPath   = 'assets/music/main.mp3';
const deathSfxPath  = 'assets/sounds/death.mp3';

// Create Audio objects
const shootSfx = new Audio(shootSfxPath);
const damageSfx = new Audio(damageSfxPath);
const bgMusic = new Audio(bgMusicPath);
const deathSfx = new Audio(deathSfxPath);

// Optional: Set volumes, loops, etc.
bgMusic.loop = true;
bgMusic.volume = 0.3;  // e.g. 50% volume
shootSfx.volume = 0.2;
damageSfx.volume = 0.2;
deathSfx.volume = 0.5;

/**
 * Call this once (e.g., when the game starts or after user interaction)
 * to begin playing background music.
 */
export function initAudio() {
    // In many browsers, audio can only play after a user gesture.
    // So typically you'd call initAudio() after the user clicks "Start Game" or something.
    bgMusic.play().catch(err => {
        console.warn('Background music cannot start until a user gesture occurs:', err);
    });
}

/** Play the shoot SFX */
export function playShootSound() {
    // Reset time so it can replay in quick succession
    shootSfx.currentTime = 0;
    shootSfx.play().catch(() => {});
}

/** Play the damage SFX */
export function playDamageSound() {
    damageSfx.currentTime = 0;
    damageSfx.play().catch(() => {});
}

/** Play the death SFX */
export function playDeathSound() {
    // Reset time so it can replay in quick succession
    deathSfx.currentTime = 0;
    deathSfx.play().catch(() => {});
}

/** (Optional) Stop / Pause the music if needed */
export function stopMusic() {
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

export function playRiftSpawnSound() {
    playDamageSound();
}

export function playRiftDamageSound() {
    playDamageSound()
}
