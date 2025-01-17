// enemy.js

import { createEnemy } from './factory/enemyFactory.js';
import { resetEnemy, recycleEnemy, getEnemyFromPool } from './enemyPool.js';
import { isColliding } from './utils.js';
import { playDeathSound } from './sound.js';
import { createGem, gems } from './gems.js';
import {obstacles} from "./obstacles.js";

// Define enemy images
// const enemyIdleImage = new Image();
// enemyIdleImage.src = 'assets/enemy_idle.png'; // Path to your idle enemy sprite

const enemyWalkImage = new Image();
enemyWalkImage.src = 'assets/enemy_walk.png'; // Path to your walking enemy sprite

const enemyDieImage = new Image();
enemyDieImage.src = 'assets/enemy_die.png'; // Path to your dying enemy sprite

const bossWalkImage = new Image();
bossWalkImage.src = 'assets/boss_walk.png'; // Path to your boss walking sprite

const bossDieImage = new Image();
bossDieImage.src = 'assets/boss_die.png'; // Path to your boss dying sprite

// Track image loading
let imagesLoaded = false;

const SPRITE_SIZE = 128;

//
const BOSS_WALK_FRAMES = 4;
const BOSS_DIE_FRAMES = 5;
const DIE_FRAMES = 4;
const WALK_FRAMES = 5;
const IDLE_FRAMES = 4;

const images = [
    // enemyIdleImage,
    enemyWalkImage,
    enemyDieImage,
    bossWalkImage,
    bossDieImage
];

// Function to load all images
function loadImages() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        images.forEach((img) => {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === images.length) {
                    imagesLoaded = true;
                    resolve();
                }
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${img.src}`));
            };
        });
    });
}

// Call loadImages and export a promise to be awaited in main.js
export const imagesPromise = loadImages();

// Existing enemy pool and MAX_GLOBAL_ENEMIES definitions
export const enemies = [];
const MAX_GLOBAL_ENEMIES = 500; // Overall enemy cap

/**
 * Spawns an enemy of a given type towards the player, considering wave parameters.
 * @param {string} enemyType - Type of enemy to spawn.
 * @param {Object} player - Player object containing x and y coordinates.
 * @param {Object} wave - Current wave object from JSON.
 * @returns {boolean} - Returns true if enemy spawned, false if maxEnemies reached.
 */
export function spawnEnemy(enemyType, player, wave) {
    // Calculate total enemies spawned from this wave
    const waveEnemies = enemies.filter(enemy => enemy.waveNumber === wave.waveNumber).length;

    if (waveEnemies >= wave.maxEnemies) {
        return false;
    }

    // Check overall max enemies
    if (enemies.length >= MAX_GLOBAL_ENEMIES) {
        // Remove the oldest enemy to make room
        const oldEnemy = enemies.shift();
        recycleEnemy(oldEnemy);
    }

    // Retrieve an enemy from the pool or create a new one with wave-specific properties
    let enemy = getEnemyFromPool(enemyType, wave.waveNumber);

    // Assign spawn position (random around player)
    const spawnRadius = 500; // Adjust based on game area
    const angle = Math.random() * Math.PI * 2;
    const spawnX = player.x + spawnRadius * Math.cos(angle);
    const spawnY = player.y + spawnRadius * Math.sin(angle);

    // Initialize enemy properties
    enemy.x = spawnX;
    enemy.y = spawnY;
    // enemy.speed and enemy.hp are already set in createEnemy or customizeEnemy
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.animationState = 'walk';
    enemy.frameIndex = 0;
    enemy.frameTimer = 0;
    enemy.facingRight = true;
    enemy.isDying = false;
    enemy.waveNumber = wave.waveNumber;

    // debug enemy using console
    console.log('HP: ', enemy.hp)

    enemies.push(enemy);
    return true;
}

/**
 * Updates all enemies: movement, animations, collisions, and recycling.
 * @param {number} delta - Time delta for frame-independent movement.
 * @param {Object} player - Player object.
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
                playDeathSound();

                if (enemy.isBoss) {
                    gems.push(createGem(enemy.x, enemy.y, 150, true));
                } else {
                    gems.push(createGem(enemy.x, enemy.y, 25));
                }

                // Remove the enemy from the active list and recycle it
                enemies.splice(i, 1);
                recycleEnemy(enemy);

                continue; // Skip the rest of the loop for this enemy
            }
            continue; // Skip further updates for dying enemies
        }

        // Normal enemy AI
        const oldX = enemy.x;
        const oldY = enemy.y;

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

        // Removed Enemy-Enemy Collision Handling for Performance
    }
}

/**
 * Updates the enemy's animation based on its current state.
 * @param {Object} enemy - Enemy object.
 */
function updateEnemyAnimation(enemy) {
    // Set frameInterval based on animationState if not already set
    if (!enemy.frameInterval) {
        switch(enemy.animationState) {
            case 'walk':
                enemy.frameInterval = 10; // Adjust the interval as needed
                break;
            case 'die':
                enemy.frameInterval = 10; // Adjust the interval as needed
                break;
            case 'idle':
            default:
                enemy.frameInterval = 10; // Adjust the interval as needed
        }
    }

    enemy.frameTimer++;
    if (enemy.frameTimer >= enemy.frameInterval) {
        enemy.frameTimer = 0;

        let totalFrames;
        if (enemy.animationState === 'walk') {
            totalFrames = enemy.isBoss ? BOSS_WALK_FRAMES : WALK_FRAMES;
        } else if (enemy.animationState === 'die') {
            totalFrames = enemy.isBoss ? BOSS_DIE_FRAMES : DIE_FRAMES;
        } else { // 'idle'
            totalFrames = IDLE_FRAMES;
        }

        if (enemy.animationState === 'die') {
            if (enemy.frameIndex < totalFrames - 1) {
                enemy.frameIndex++;
            }
        } else {
            enemy.frameIndex = (enemy.frameIndex + 1) % totalFrames;
        }
    }
}


/**
 * Draws all active enemies on the canvas.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 */
export function drawEnemies(ctx) {
    enemies.forEach(enemy => {
        ctx.save();

        let sheet;
        if (enemy.isBoss) {
            sheet = enemy.animationState === 'die' ? bossDieImage : bossWalkImage;
        } else {
            switch (enemy.animationState) {
                case 'walk':
                    sheet = enemyWalkImage;
                    break;
                case 'die':
                    sheet = enemyDieImage;
                    break;
                default:
                    // sheet = enemyIdleImage;
                    break;
            }
        }

        const sourceX = enemy.frameIndex * SPRITE_SIZE;
        const sourceY = 0;

        const drawWidth = enemy.isBoss ? SPRITE_SIZE * 2 : SPRITE_SIZE;
        const drawHeight = enemy.isBoss ? SPRITE_SIZE * 2 : SPRITE_SIZE;

        const drawX = enemy.x - drawWidth / 2;
        const drawY = enemy.y - drawHeight / 2;

        // Handle flipping
        ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
        if (!enemy.facingRight) {
            ctx.scale(-1, 1);
        }

        // Show enemy hp in console

        // Draw the enemy sprite
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
 * Returns the nearest enemy to the player.
 * @param {Object} player - Player object.
 * @returns {Object|null} - Nearest enemy or null if no enemies exist.
 */
export function getNearestEnemy(player) {
    if (enemies.length === 0) return null;

    let closest = null;
    let minDistSq = Infinity;

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistSq) {
            minDistSq = distSq;
            closest = enemy;
        }
    }

    return closest;
}

// Export the enemy images in case other modules need access (optional)
export {
    // enemyIdleImage,
    enemyWalkImage,
    enemyDieImage,
    bossWalkImage,
    bossDieImage
};
