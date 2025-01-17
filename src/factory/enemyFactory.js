// enemyFactory.js

import { BasicEnemy, AdvancedEnemy, BossEnemy } from '../types/enemyTypes.js'; // Define these classes appropriately

export function createEnemy(enemyType, waveNumber) {
    let enemy;
    switch(enemyType) {
        case 'basic':
            enemy = new BasicEnemy();
            enemy.hp += waveNumber * 2;
            enemy.speed += waveNumber * 0.1;
            break;
        case 'advanced':
            enemy = new AdvancedEnemy();
            enemy.hp += waveNumber * 3;
            enemy.speed += waveNumber * 0.2;
            break;
        case 'boss':
            enemy = new BossEnemy();
            enemy.hp += waveNumber * 10; // Bosses scale differently
            enemy.speed += waveNumber * 0.05;
            break;
        // Add more cases for different enemy types
        default:
            console.warn(`Unknown enemy type: ${enemyType}`);
            enemy = new BasicEnemy();
            break;
    }
    return enemy;
}
