// enemy.js

import { isColliding } from './utils.js';
export const enemies = [];
import { MAP_WIDTH, MAP_HEIGHT } from './camera.js';
import {player} from "./player.js";
import {obstacles} from "./obstacles.js"; // <-- import map dimensions

// Example paths to your enemy sprite sheets
// (same format as player, each 128x128 per frame, horizontal frames)
const enemyIdleImage = new Image();
enemyIdleImage.src = 'assets/enemy_idle.png';  // e.g. 5 frames -> 640x128

const enemyWalkImage = new Image();
enemyWalkImage.src = 'assets/enemy_walk.png';  // e.g. 6 frames -> 768x128

// Constants for sprite frames
const SPRITE_SIZE = 128;   // each frame is 128 wide, 128 tall
const IDLE_FRAMES = 5;     // e.g., 5 frames
const WALK_FRAMES = 6;     // e.g., 6 frames

/**
 * Spawns a wave of enemies in a radial pattern around the center of the *map*,
 * not just the 800x600 canvas.
 */
export function spawnWave(count, waveNumber) {
    // Center of the map
    // const cx = MAP_WIDTH / 2;
    // const cy = MAP_HEIGHT / 2;

    const cx = player.x;
    const cy = player.y;

    // Radius: half the diagonal of the map + buffer
    // e.g. sqrt((3200/2)^2 + (3200/2)^2) ~= 2262 + some buffer
    const radius = Math.sqrt((1200 / 2) ** 2 + (1000 / 2) ** 2) + 50;

    for (let i = 0; i < count; i++) {
        // Random angle [0..2π)
        const angle = Math.random() * Math.PI * 2;
        // Convert polar to Cartesian
        const spawnX = cx + radius * Math.cos(angle);
        const spawnY = cy + radius * Math.sin(angle);

        enemies.push({
            x: spawnX,
            y: spawnY,
            width: 32,
            height: 32,
            speed: (0.8 + waveNumber * 0.1) + Math.random() * 0.2,
            hp: 1 + waveNumber * 0.2,

            vx: 0,
            vy: 0,

            // --- Animation ---
            animationState: 'walk',  // or 'idle'
            frameIndex: 0,
            frameTimer: 0,
            frameInterval: 10,       // how fast to cycle frames
            facingRight: true        // we’ll flip if false
        });
    }
}

/**
 * Update all enemies:
 *   1) Move them toward the player.
 *   2) Apply knockback (vx, vy) each frame.
 *   3) Apply friction to vx, vy.
 *   4) Collision checks (obstacles, other enemies).
 */
export function updateEnemies(delta, player) {
    enemies.forEach(enemy => {
        const oldX = enemy.x;
        const oldY = enemy.y;

        // -- Normal AI movement (move toward player) --
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        enemy.facingRight = player.x >= enemy.x;

        // Hardcode to always 'walk' if you want them always moving
        enemy.animationState = 'walk';

        // -- Add knockback velocity (vx, vy) --
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        // -- Apply friction so knockback slows over time --
        enemy.vx *= 0.8; // tweak friction as you like (0.9 = less friction)
        enemy.vy *= 0.8;

        // -- Obstacle collisions (if you have them) --
        if (obstacles) {
            for (const obs of obstacles) {
                if (isColliding(enemy, obs)) {
                    // Revert
                    enemy.x = oldX;
                    enemy.y = oldY;
                    break;
                }
            }
        }
    });

    // -- Prevent enemies overlapping each other (optional) --
    for (let i = 0; i < enemies.length - 1; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            if (isColliding(enemies[i], enemies[j])) {
                separate(enemies[i], enemies[j]);
            }
        }
    }
}

function updateEnemyAnimation(enemy) {
    enemy.frameTimer++;
    if (enemy.frameTimer >= enemy.frameInterval) {
        enemy.frameTimer = 0;
        if (enemy.animationState === 'walk') {
            enemy.frameIndex = (enemy.frameIndex + 1) % WALK_FRAMES;
        } else {
            enemy.frameIndex = (enemy.frameIndex + 1) % IDLE_FRAMES;
        }
    }
}


/**
 * Simple function to calculate overlap and push enemies apart
 */
function separate(e1, e2) {
    const { overlapX, overlapY } = getOverlap(e1, e2);

    if (overlapX > 0 && overlapY > 0) {
        // Decide which axis to push them along (the smaller overlap)
        if (overlapX < overlapY) {
            // Push along the X axis
            if (e1.x < e2.x) {
                e1.x -= overlapX / 2;
                e2.x += overlapX / 2;
            } else {
                e1.x += overlapX / 2;
                e2.x -= overlapX / 2;
            }
        } else {
            // Push along the Y axis
            if (e1.y < e2.y) {
                e1.y -= overlapY / 2;
                e2.y += overlapY / 2;
            } else {
                e1.y += overlapY / 2;
                e2.y -= overlapY / 2;
            }
        }
    }
}

function getOverlap(e1, e2) {
    const overlapX =
        Math.min(e1.x + e1.width, e2.x + e2.width) -
        Math.max(e1.x, e2.x);

    const overlapY =
        Math.min(e1.y + e1.height, e2.y + e2.height) -
        Math.max(e1.y, e2.y);

    return { overlapX, overlapY };
}

/**
 * Draw all enemies
 */
export function drawEnemies(ctx) {
    enemies.forEach(enemy => {
        ctx.save();

        // Pick which sprite sheet
        const sheet = (enemy.animationState === 'walk') ? enemyWalkImage : enemyIdleImage;
        const frames = (enemy.animationState === 'walk') ? WALK_FRAMES : IDLE_FRAMES;

        // Which frame?
        const sourceX = enemy.frameIndex * SPRITE_SIZE;
        const sourceY = 0;

        // We want to draw the 128x128 sprite, possibly flipping
        // We can offset the draw so the enemy.x,y is near the center or feet
        // For example:
        const drawX = enemy.x - 48; // shift left so collision box is smaller
        const drawY = enemy.y - 96;
        const drawWidth = SPRITE_SIZE;
        const drawHeight = SPRITE_SIZE;

        // Translate to sprite center for flipping
        ctx.translate(drawX + drawWidth/2, drawY + drawHeight/2);
        if (!enemy.facingRight) {
            // Flip horizontally
            ctx.scale(-1, 1);
        }
        // Now the top-left corner is at (-drawWidth/2, -drawHeight/2)
        ctx.drawImage(
            sheet,
            sourceX,
            sourceY,
            SPRITE_SIZE,
            SPRITE_SIZE,
            -drawWidth/2,
            -drawHeight/2,
            drawWidth,
            drawHeight
        );

        ctx.restore();
    });
}


/**
 * Return the nearest enemy to the player
 */
export function getNearestEnemy(player) {
    if (enemies.length === 0) return null;

    let closest = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
            minDist = dist;
            closest = enemy;
        }
    });

    return closest;
}
