// bullet.js handles bullet creation and updates
import { MAP_WIDTH, MAP_HEIGHT } from './camera.js';

export const bullets = [];

// Create the bullet sprite
const bulletImage = new Image();
bulletImage.src = 'assets/projectile.png';  // path to your 48x192 bullet sprite

// Constants for the bullet frames
const BULLET_FRAME_WIDTH = 48;
const BULLET_FRAME_HEIGHT = 64;
const BULLET_TOTAL_FRAMES = 3;

// Factory function to create a bullet
export function createBullet({ x, y, vx, vy }) {
    // Calculate angle so the sprite can rotate
    const angle = Math.atan2(vy, vx); // bullet is facing right at 0°, so we rotate from +x

    return {
        x,
        y,
        vx,
        vy,
        angle,
        width: BULLET_FRAME_WIDTH,
        height: BULLET_FRAME_HEIGHT,

        // Animation fields if we want to cycle frames
        frameIndex: 0,
        frameTimer: 0,
        frameInterval: 6 // how many 'ticks' or frames before advancing
    };
}

// Update bullet positions
export function updateBullets(canvas) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Optional: animate bullet frames
        // b.frameTimer++;
        // if (b.frameTimer >= b.frameInterval) {
        //     b.frameTimer = 0;
        //     b.frameIndex = (b.frameIndex + 1) % BULLET_TOTAL_FRAMES;
        // }

        // In your updateBullets function:
        if (
            b.x + b.width < 0 ||
            b.x > MAP_WIDTH ||
            b.y + b.height < 0 ||
            b.y > MAP_HEIGHT
        ) {
            // remove bullet only if it's completely out of the world
            bullets.splice(i, 1);
        }
    }
}

// Draw bullets
export function drawBullets(ctx) {
    bullets.forEach(b => {
        ctx.save();

        // Move origin to bullet center
        const centerX = b.x + b.width / 2;
        const centerY = b.y + b.height / 2;
        ctx.translate(centerX, centerY);

        // Rotate by bullet.angle (bullet faces right if angle=0)
        ctx.rotate(b.angle);

        // The bullet's top-left after rotation
        const drawX = -b.width / 2;
        const drawY = -b.height / 2;

        // Which frame in the sprite sheet
        const sourceX = 0;
        const sourceY = b.frameIndex * BULLET_FRAME_HEIGHT;

        ctx.drawImage(
            bulletImage,
            // source rect
            sourceX,
            sourceY,
            BULLET_FRAME_WIDTH,
            BULLET_FRAME_HEIGHT,
            // destination rect
            drawX,
            drawY,
            b.width,
            b.height
        );

        ctx.restore();
    });
}