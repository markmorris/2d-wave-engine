// enemy.js

// Suppose you store enemies in this array (exported to main.js)
export const enemies = [];

// Example isColliding import (adjust the import path as needed)
import { isColliding } from './utils.js';

/**
 * Spawns a wave of enemies along the top.
 * (Unchanged — only shown for context)
 */
export function spawnWave(count, waveNumber, canvasWidth) {
    for (let i = 0; i < count; i++) {
        enemies.push({
            x: Math.random() * (canvasWidth - 32),
            y: -32,
            width: 32,
            height: 32,
            speed: 1.5 + waveNumber * 0.3,
            hp: 1,
        });
    }
}

/**
 * Update all enemies:
 *  1) Move them toward the player.
 *  2) Prevent overlapping by separating any colliding enemies.
 */
export function updateEnemies(delta, player) {
    // 1) Move enemies toward the player
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
    });

    // 2) Prevent enemies from overlapping each other
    for (let i = 0; i < enemies.length - 1; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            if (isColliding(enemies[i], enemies[j])) {
                separate(enemies[i], enemies[j]);
            }
        }
    }
}

/**
 * Simple function to calculate overlap and push enemies apart
 */
function separate(e1, e2) {
    const { overlapX, overlapY } = getOverlap(e1, e2);

    // If they're truly overlapping in both axes
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

/**
 * Calculate how much e1 and e2 overlap on x and y axes.
 */
function getOverlap(e1, e2) {
    const overlapX =
        Math.min(e1.x + e1.width, e2.x + e2.width) -
        Math.max(e1.x, e2.x);

    const overlapY =
        Math.min(e1.y + e1.height, e2.y + e2.height) -
        Math.max(e1.y, e2.y);

    return { overlapX, overlapY };
}

// Draw all enemies
export function drawEnemies(ctx) {
    ctx.fillStyle = 'blue';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Return the nearest enemy to the player
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