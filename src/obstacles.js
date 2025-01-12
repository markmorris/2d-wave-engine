// obstacles.js

import { MAP_WIDTH, MAP_HEIGHT } from './camera.js'; // or wherever you define these

// Store all obstacles in an array
export const obstacles = [];

/**
 * Spawn some random static 32x32 blocks around the map.
 * For now, just random positions. You might want to ensure
 * they don’t spawn too close to the player start, etc.
 */
export function spawnObstacles(count) {
    obstacles.length = 0; // clear existing if any
    for (let i = 0; i < count; i++) {
        const x = Math.random() * (MAP_WIDTH - 32);
        const y = Math.random() * (MAP_HEIGHT - 32);

        obstacles.push({
            x,
            y,
            width: 32,
            height: 32
        });
    }
}

/**
 * Draw all obstacles as gray squares (for example).
 */
export function drawObstacles(ctx) {
    ctx.fillStyle = 'black';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}
