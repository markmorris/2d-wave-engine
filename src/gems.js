// e.g. in main.js
import {gainXP, player} from "./player.js";

export const gems = [];

const gemImage = new Image();
gemImage.src = 'assets/gem.png';  // e.g. 5 frames -> 640x128

// Each gem might look like:
export function createGem(x, y, expValue) {
    return {
        x,
        y,
        expValue,   // how much XP the gem gives
        size: 32    // or 8, or any visual size you want
    };
}

export function updateGems() {
    // 1) Check if player is close enough to pick up each gem
    for (let i = gems.length - 1; i >= 0; i--) {
        const gem = gems[i];

        // Distance from player to gem
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.pickupRadius) {
            // The player collects the gem
            // player.xp += gem.expValue;
            gainXP(gem.expValue);
            // or call a function: gainXP(gem.expValue);

            // remove gem from array
            gems.splice(i, 1);

            // optional: play a pickup sound
            // playGemPickupSound();
        }
    }
}

export function drawGems(ctx) {
    gems.forEach(gem => {
        ctx.save();

        // Draw the gem image at (gem.x, gem.y).
        // Center it by offsetting half its size in both directions:
        const halfSize = gem.size / 2;
        ctx.drawImage(
            gemImage,
            gem.x - halfSize,
            gem.y - halfSize,
            gem.size,
            gem.size
        );

        ctx.restore();
    });
}
