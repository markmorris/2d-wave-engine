// enemyPool.js

import { createEnemy } from './factory/enemyFactory.js';

/**
 * Object pool to manage different enemy types.
 */
const enemyPool = {
    basic: [],
    advanced: [],
    boss: []
    // Add more types as needed
};

/**
 * Retrieves an enemy from the pool based on type.
 * @param {string} enemyType - Type of enemy to retrieve.
 * @param {number} waveNumber - Current wave number for scaling.
 * @returns {Object} - Enemy object ready to be initialized.
 */
export function getEnemyFromPool(enemyType, waveNumber) {
    if (enemyPool[enemyType] && enemyPool[enemyType].length > 0) {
        const enemy = enemyPool[enemyType].pop();
        // Customize enemy based on wave number
        customizeEnemy(enemy, enemyType, waveNumber);
        return enemy;
    }
    return createEnemy(enemyType, waveNumber);
}

/**
 * Recycles an enemy back into the pool based on its type.
 * @param {Object} enemy - Enemy object to recycle.
 */
export function recycleEnemy(enemy) {
    resetEnemy(enemy);
    if (enemy.isBoss) {
        enemyPool.boss.push(enemy);
    } else {
        enemyPool[enemy.type].push(enemy); // Assuming enemy.type is defined
    }
}

/**
 * Resets an enemy's properties to default values before reusing from the pool.
 * @param {Object} enemy - Enemy object to reset.
 */
export function resetEnemy(enemy) {
    enemy.x = 0;
    enemy.y = 0;
    enemy.speed = 0;
    enemy.hp = 0;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.animationState = 'idle';
    enemy.frameIndex = 0;
    enemy.frameTimer = 0;
    enemy.facingRight = true;
    enemy.isDying = false;
    enemy.waveNumber = 0;
    // Add any other properties that need to be reset
}

/**
 * Customizes an enemy's properties based on its type and wave number.
 * @param {Object} enemy - Enemy object to customize.
 * @param {string} enemyType - Type of enemy.
 * @param {number} waveNumber - Current wave number.
 */
function customizeEnemy(enemy, enemyType, waveNumber) {
    switch(enemyType) {
        case 'basic':
            enemy.hp += waveNumber * 2;
            enemy.speed += waveNumber * 0.1;
            break;
        case 'advanced':
            enemy.hp += waveNumber * 3;
            enemy.speed += waveNumber * 0.2;
            break;
        case 'boss':
            enemy.hp += waveNumber * 10;
            enemy.speed += waveNumber * 0.05;
            break;
        // Add more cases for different enemy types
        default:
            console.warn(`Unknown enemy type during customization: ${enemyType}`);
            break;
    }
}
