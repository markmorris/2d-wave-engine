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
    for (let b = bullets.length - 1; b >= 0; b--) {
        for (let e = enemies.length - 1; e >= 0; e--) {
            if (isColliding(bullets[b], enemies[e])) {
                // Bullet hits enemy
                enemies[e].hp--;

                // Compute knockback vector (from bullet center to enemy center)
                const dx = (enemies[e].x + enemies[e].width / 2) - (bullets[b].x + bullets[b].width / 2);
                const dy = (enemies[e].y + enemies[e].height / 2) - (bullets[b].y + bullets[b].height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    // Adjust knockback strength as desired
                    const knockbackStrength = 15;
                    enemies[e].vx = (dx / dist) * knockbackStrength;
                    enemies[e].vy = (dy / dist) * knockbackStrength;
                }

                // Remove the bullet
                bullets.splice(b, 1);

                // If enemy is killed, remove enemy and grant XP
                if (enemies[e].hp <= 0) {
                    enemies.splice(e, 1);
                    // e.g. XP or onKillEnemy() if you want:
                    onKillEnemy?.(); // if you have that function
                }

                // Break out of enemy loop (this bullet is done)
                break;
            }
        }
    }
}
