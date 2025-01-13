// enemy.js

import { isColliding } from './utils.js';
export const enemies = [];
import { MAP_WIDTH, MAP_HEIGHT } from './camera.js';
import {player} from "./player.js";
import {obstacles} from "./obstacles.js";
import {playDeathSound} from "./sound.js";
import {createGem, gems} from "./gems.js"; // <-- import map dimensions

// Example paths to your enemy sprite sheets
// (same format as player, each 128x128 per frame, horizontal frames)
const enemyIdleImage = new Image();
enemyIdleImage.src = 'assets/enemy_idle.png';  // e.g. 5 frames -> 640x128

const enemyWalkImage = new Image();
enemyWalkImage.src = 'assets/enemy_walk.png';  // e.g. 6 frames -> 768x128

// NEW: Death sprite (4 frames across, 128x128 each => 512x128 total)
const enemyDieImage = new Image();
enemyDieImage.src = 'assets/enemy_die.png';

// ----- BOSS Enemy Sprites ----- //
const bossWalkImage = new Image();
bossWalkImage.src = 'assets/boss_walk.png';    // e.g. same format, 6 frames -> 768x128?

const bossDieImage = new Image();
bossDieImage.src = 'assets/boss_die.png';      // e.g. 4 frames -> 512x128?

// Constants for sprite frames
const SPRITE_SIZE = 128;   // each frame is 128 wide, 128 tall
const IDLE_FRAMES = 5;     // e.g., 5 frames
const WALK_FRAMES = 5;     // e.g., 6 frames
const DIE_FRAMES  = 4;     // 4 frames for death
const BOSS_WALK_FRAMES = 6;     // e.g., 6 frames for boss
const BOSS_DIE_FRAMES  = 5;     // 4 frames for boss death

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
            facingRight: true,        // we’ll flip if false
            isDying: false,  // convenience flag if we want it
            isBoss: false   // convenience flag if we want it
        });
    }

    // 2) Every 5th wave, spawn a boss
    if (waveNumber % 5 === 0) {
        // We'll just spawn ONE boss. You can spawn more or a bigger boss if you want
        const bossAngle = Math.random() * Math.PI * 2;
        const bossSpawnX = cx + radius * Math.cos(bossAngle);
        const bossSpawnY = cy + radius * Math.sin(bossAngle);

        enemies.push({
            x: bossSpawnX,
            y: bossSpawnY,
            width: 64,    // If you want bigger collision box
            height: 64,   // for a boss
            speed: 1.0,   // maybe slightly slower or can be faster

            // Give the boss a large HP. E.g. 20 + waveNumber * 2
            // Tweak as you like
            hp: 150 + waveNumber * 2,

            vx: 0,
            vy: 0,
            animationState: 'walk',
            frameIndex: 0,
            frameTimer: 0,
            frameInterval: 10,
            facingRight: true,
            isDying: false,
            isBoss: true
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
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // If the enemy is dying, skip normal movement
        if (enemy.animationState === 'die') {
            // Optionally reduce knockback, speed, etc.
            enemy.vx = 0;
            enemy.vy = 0;
            enemy.speed = 0;

            // Update the death animation frames
            updateEnemyAnimation(enemy);

            // Once we reach the last frame in the death animation
            // we remove the enemy from the array.
            if (enemy.frameIndex === DIE_FRAMES - 1 && enemy.frameTimer === 0) {
                // meaning we just finished the last frame of death animation
                enemies.splice(i, 1);

                playDeathSound();

                if (enemy.isBoss) {
                    gems.push(createGem(enemy.x, enemy.y, 150, true));
                } else {
                    gems.push(createGem(enemy.x, enemy.y, 25));
                }
            }
            continue; // skip the rest for this enemy
        }

        // else normal AI for living enemies
        const oldX = enemy.x;
        const oldY = enemy.y;

        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        enemy.facingRight = (player.x >= enemy.x);
        enemy.animationState = 'walk';  // or idle if you want logic

        // Apply knockback velocity
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        // friction
        enemy.vx *= 0.8;
        enemy.vy *= 0.8;

        updateEnemyAnimation(enemy);

        // obstacle collisions
        if (obstacles) {
            for (const obs of obstacles) {
                if (isColliding(enemy, obs)) {
                    enemy.x = oldX;
                    enemy.y = oldY;
                    break;
                }
            }
        }

        // Prevent enemies overlapping each other
        for (let m = 0; m < enemies.length - 1; m++) {
            for (let n = m + 1; n < enemies.length; n++) {
                if (isColliding(enemies[m], enemies[n])) {
                    separate(enemies[m], enemies[n]);
                }
            }
        }
    }
}


function updateEnemyAnimation(enemy) {
    enemy.frameTimer++;
    if (enemy.frameTimer >= enemy.frameInterval) {
        enemy.frameTimer = 0;

        switch (enemy.animationState) {

            case 'walk':
                if (enemy.isBoss) {
                    // Use boss walk frames
                    enemy.frameIndex = (enemy.frameIndex + 1) % BOSS_WALK_FRAMES;
                } else {
                    // Normal enemy
                    enemy.frameIndex = (enemy.frameIndex + 1) % WALK_FRAMES;
                }
                break;

            case 'idle':
                // If you want the boss to have different idle frames, do the same approach here
                enemy.frameIndex = (enemy.frameIndex + 1) % IDLE_FRAMES;
                break;

            case 'die':
                if (enemy.isBoss) {
                    // Boss has more die frames
                    if (enemy.frameIndex < BOSS_DIE_FRAMES - 1) {
                        enemy.frameIndex++;
                    }
                } else {
                    // Normal enemy
                    if (enemy.frameIndex < DIE_FRAMES - 1) {
                        enemy.frameIndex++;
                    }
                }
                break;
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
 * Draw all enemies, picking boss or normal sprites.
 */
export function drawEnemies(ctx) {
    enemies.forEach(enemy => {
        ctx.save();

        let sheet; // which image
        // We don't need separate frames for boss vs. normal, since the count is the same
        // We'll still pick different sheets for visuals:
        if (enemy.isBoss) {
            // boss logic
            if (enemy.animationState === 'die') {
                sheet = bossDieImage;
            } else {
                // 'walk' or 'idle'
                sheet = bossWalkImage;
            }
        } else {
            // normal enemy
            switch (enemy.animationState) {
                case 'walk':
                    sheet = enemyWalkImage;
                    break;
                case 'die':
                    sheet = enemyDieImage;
                    break;
                default:
                    sheet = enemyIdleImage;
                    break;
            }
        }

        // each frame is 128 wide, 128 high
        const sourceX = enemy.frameIndex * SPRITE_SIZE;
        const sourceY = 0;

        // let's draw at 128x128
        const drawWidth  = SPRITE_SIZE;
        const drawHeight = SPRITE_SIZE;

        // offset so sprite foot roughly lines up with collision box
        const drawX = enemy.x - 48;
        const drawY = enemy.y - 96;

        // handle flipping
        ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
        if (!enemy.facingRight) {
            ctx.scale(-1, 1);
        }

        // draw
        ctx.drawImage(
            sheet,
            sourceX,
            sourceY,
            SPRITE_SIZE,
            SPRITE_SIZE,
            -drawWidth / 2,
            -drawHeight / 2,
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
