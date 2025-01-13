// e.g. in main.js
import {gainXP, player} from "./player.js";

export const gems = [];

const gemImage = new Image();
gemImage.src = 'assets/gem.png';  // e.g. 5 frames -> 640x128

const diamondImage = new Image();
diamondImage.src = 'assets/diamond.png';  // e.g. 5 frames -> 640x128

// Each gem might look like:
export function createGem(x, y, expValue, isDiamond) {
    return {
        x,
        y,
        expValue,   // how much XP the gem gives
        size: 32,    // or 8, or any visual size you want
        isDiamond: isDiamond,
        isPulled: false, // whether gem is currently flying toward the player
        pullSpeed: 5     // how fast it flies toward the player
    };
}

export function updateGems() {
    for (let i = gems.length - 1; i >= 0; i--) {
        const gem = gems[i];

        // Distance from player to gem
        const dx = player.x - gem.x;
        const dy = player.y - gem.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 1) If within a certain "pull radius", start flying toward the player
        //    (You can choose any radius you like, e.g. 200)
        if (!gem.isPulled && dist < player.pickupRadius) {
            gem.isPulled = true;
        }

        if (gem.isPulled) {
            // 2) Move gem toward player
            //    We'll normalize (dx, dy) and multiply by gem.pullSpeed
            if (dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                // Move the gem
                gem.x += nx * gem.pullSpeed;
                gem.y += ny * gem.pullSpeed;
            }
        }

        // 3) Final pickup condition: if gem is very close to player
        //    We'll say < 10 distance => finalize
        if (dist < 10) {
            // The player collects the gem
            gainXP(gem.expValue);
            gems.splice(i, 1);
            // optional: playGemPickupSound();
            continue;
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
            gem.isDiamond ? diamondImage : gemImage,
            gem.x - halfSize,
            gem.y - halfSize,
            gem.size,
            gem.size
        );

        ctx.restore();
    });
}
