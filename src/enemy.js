// enemy.js

import { isColliding } from './utils.js';
export const enemies = [];
import {MAP_WIDTH, MAP_HEIGHT, getCamera} from './camera.js';
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

const MAX_ENEMIES = 500; // Adjustable maximum number of enemies on screen
const enemyPool = [];    // Pool to store recycled enemy objects

/**
 * Spawns a wave of enemies in a radial pattern around the center of the *map*,
 * not just the 800x600 canvas.
 */
// enemy.js

export function spawnWave(count, waveNumber) {
    const cx = player.x;
    const cy = player.y;

    const radius = Math.sqrt((1200 / 2) ** 2 + (1000 / 2) ** 2) + 50;

    for (let i = 0; i < count; i++) {
        // Check if maximum enemies are reached
        if (enemies.length >= MAX_ENEMIES) {
            // Remove the oldest enemy (from the front of the array)
            const oldEnemy = enemies.shift();
            recycleEnemy(oldEnemy);
        }

        const enemy = getEnemy(); // Retrieves from pool or creates new

        // Assign spawn position
        const angle = Math.random() * Math.PI * 2;
        const spawnX = cx + radius * Math.cos(angle);
        const spawnY = cy + radius * Math.sin(angle);

        // Initialize enemy properties
        enemy.x = spawnX;
        enemy.y = spawnY;
        enemy.speed = (0.8 + waveNumber * 0.1) + Math.random() * 0.2;
        enemy.hp = 1 + waveNumber * 0.2;
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.animationState = 'walk';
        enemy.frameIndex = 0;
        enemy.frameTimer = 0;
        enemy.facingRight = true;
        enemy.isDying = false;
        enemy.isBoss = false;

        enemies.push(enemy);
    }

    // 2) Every 5th wave, spawn a boss
    if (waveNumber % 5 === 0) {
        // Ensure we don't exceed MAX_ENEMIES
        if (enemies.length >= MAX_ENEMIES) {
            const oldBoss = enemies.shift();
            recycleEnemy(oldBoss);
        }

        const boss = getEnemy(true);

        const bossAngle = Math.random() * Math.PI * 2;
        const bossSpawnX = cx + radius * Math.cos(bossAngle);
        const bossSpawnY = cy + radius * Math.sin(bossAngle);

        boss.x = bossSpawnX;
        boss.y = bossSpawnY;
        boss.speed = 1.0;
        boss.hp = 150 + waveNumber * 2;
        boss.vx = 0;
        boss.vy = 0;
        boss.animationState = 'walk';
        boss.frameIndex = 0;
        boss.frameTimer = 0;
        boss.facingRight = true;
        boss.isDying = false;

        enemies.push(boss);
    }
}

// enemy.js

/**
 * Creates a new enemy object.
 * @param {boolean} isBoss - Indicates if the enemy is a boss.
 * @returns {Object} - New enemy object.
 */
function createNewEnemy(isBoss = false) {
    return {
        x: 0,
        y: 0,
        width: isBoss ? 64 : 32,    // Larger size for bosses
        height: isBoss ? 64 : 32,
        speed: 0,
        hp: 0,
        vx: 0,
        vy: 0,
        animationState: 'idle',
        frameIndex: 0,
        frameTimer: 0,
        frameInterval: 10,
        facingRight: true,
        isDying: false,
        isBoss: isBoss
    };
}

/**
 * Resets an enemy's properties to default values.
 * @param {Object} enemy - Enemy object to reset.
 */
function resetEnemy(enemy) {
    enemy.x = 0;
    enemy.y = 0;
    enemy.width = enemy.isBoss ? 64 : 32;
    enemy.height = enemy.isBoss ? 64 : 32;
    enemy.speed = 0;
    enemy.hp = 0;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.animationState = 'idle';
    enemy.frameIndex = 0;
    enemy.frameTimer = 0;
    enemy.facingRight = true;
    enemy.isDying = false;
    // Note: isBoss should remain as isBoss
}

/**
 * Retrieves an enemy from the pool or creates a new one if the pool is empty.
 * @param {boolean} isBoss - Indicates if the enemy to retrieve is a boss.
 * @returns {Object} - Enemy object ready to be initialized.
 */
function getEnemy(isBoss = false) {
    if (enemyPool.length > 0) {
        const enemy = enemyPool.pop();
        enemy.isBoss = isBoss;
        resetEnemy(enemy); // Ensure it's reset before reuse
        return enemy;
    }
    return createNewEnemy(isBoss);
}

/**
 * Returns an enemy to the pool after resetting its properties.
 * @param {Object} enemy - Enemy object to return to the pool.
 */
function recycleEnemy(enemy) {
    resetEnemy(enemy);
    enemyPool.push(enemy);
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
            enemy.vx = 0;
            enemy.vy = 0;
            enemy.speed = 0;

            // Update the death animation frames
            updateEnemyAnimation(enemy);

            // Once we reach the last frame in the death animation
            if (enemy.frameIndex === (enemy.isBoss ? BOSS_DIE_FRAMES - 1 : DIE_FRAMES - 1) && enemy.frameTimer === 0) {
                // Play death sound
                playDeathSound();

                // Create gems
                if (enemy.isBoss) {
                    gems.push(createGem(enemy.x, enemy.y, 150, true));
                } else {
                    gems.push(createGem(enemy.x, enemy.y, 25));
                }

                // Remove the enemy from the active list and add to the pool
                enemies.splice(i, 1);
                recycleEnemy(enemy);

                continue; // Skip the rest of the loop for this enemy
            }
            continue; // Skip further updates for dying enemies
        }

        // Normal enemy AI
        const oldX = enemy.x;
        const oldY = enemy.y;

        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0) {
            const dist = Math.sqrt(distSq);
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        enemy.facingRight = (player.x >= enemy.x);
        enemy.animationState = 'walk';  // or idle if you want logic

        // Apply knockback velocity
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        // Apply friction
        enemy.vx *= 0.8;
        enemy.vy *= 0.8;

        updateEnemyAnimation(enemy);

        // Obstacle collisions
        if (obstacles) {
            for (const obs of obstacles) {
                if (isColliding(enemy, obs)) {
                    enemy.x = oldX;
                    enemy.y = oldY;
                    break;
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
    const camera = getCamera(); // Implement a function to retrieve camera position
    const buffer = 100; // Buffer area around the screen to preload enemies

    enemies.forEach(enemy => {
       // Culling: Check if enemy is within the visible area plus buffer
       if (
           enemy.x + enemy.width < camera.x - buffer ||
           enemy.x - enemy.width > camera.x + buffer.width + buffer ||
           enemy.y + enemy.height < camera.y - buffer ||
           enemy.y - enemy.height > camera.y + buffer.height + buffer
       ) {
           return; // Skip drawing this enemy
       }

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
