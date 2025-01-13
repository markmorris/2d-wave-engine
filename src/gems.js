// e.g. in main.js
import {gainXP, player} from "./player.js";

export const gems = [];

// Each gem might look like:
export function createGem(x, y, expValue) {
    return {
        x,
        y,
        expValue,   // how much XP the gem gives
        size: 16    // or 8, or any visual size you want
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
    // 2) Draw each gem
    gems.forEach(gem => {
        ctx.save();

        // For a simple shape, e.g. a circle:
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}