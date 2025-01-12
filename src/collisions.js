import { isColliding } from './utils.js';
import { onKillEnemy } from './player.js';
import {playDamageSound} from "./sound.js";

/**
 * Check if any enemy collides with the player.
 * If so, reduce HP, remove that enemy. If HP <= 0, call gameOverCallback().
 */
export function checkEnemyPlayerCollisions(player, enemies, gameOverCallback) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(player, enemies[i])) {
            // Player takes damage
            player.hp--;
            // Remove enemy
            enemies.splice(i, 1);

            // Play damage SFX
            playDamageSound();

            // Check if player is dead
            if (player.hp <= 0) {
                gameOverCallback();
                return;
            }
        }
    }
}

/**
 * Check if bullet collides with enemy, handle kills/XP.
 */
export function checkBulletEnemyCollisions(bullets, enemies, player) {
    let killCount = 0;

    for (let b = bullets.length - 1; b >= 0; b--) {
        for (let e = enemies.length - 1; e >= 0; e--) {
            if (isColliding(bullets[b], enemies[e])) {
                enemies[e].hp--;
                // Remove bullet
                bullets.splice(b, 1);

                if (enemies[e].hp <= 0) {
                    enemies.splice(e, 1);
                    killCount++;

                    // Instead of attackCooldown => now we do:
                    onKillEnemy(); // grant XP, handle level ups

                    // Optionally: still keep a small auto-buff if you want
                    // player.attackCooldown = Math.max(300, player.attackCooldown - 50);
                }

                break; // bullet is gone, break out of enemy loop
            }
        }
    }

    return killCount;
}
