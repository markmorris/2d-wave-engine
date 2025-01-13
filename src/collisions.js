import { isColliding } from './utils.js';
import { onKillEnemy } from './player.js';
import { playDamageSound } from './sound.js';

/**
 * Check if any enemy collides with the player.
 * If so, reduce HP, remove that enemy. If HP <= 0, call gameOverCallback().
 * (This logic can stay the same, or you could also set the enemy to 'die' instead
 * of removing instantly, if you want a death animation for collisions too.)
 */
export function checkEnemyPlayerCollisions(player, enemies, gameOverCallback) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(player, enemies[i])) {
            // Player takes damage
            player.hp--;
            // Remove enemy immediately (or set them to 'die' if you want an animation)
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
 * Updated so that if an enemy's HP <= 0, we set them to a 'die' state
 * rather than removing them from the array.
 */
export function checkBulletEnemyCollisions(bullets, enemies, player) {
    for (let b = bullets.length - 1; b >= 0; b--) {
        for (let e = enemies.length - 1; e >= 0; e--) {
            if (isColliding(bullets[b], enemies[e])) {
                // Bullet hits enemy
                enemies[e].hp -= bullets[b].damage;

                // Compute knockback vector (from bullet center to enemy center)
                const dx = (enemies[e].x + enemies[e].width / 2) - (bullets[b].x + bullets[b].width / 2);
                const dy = (enemies[e].y + enemies[e].height / 2) - (bullets[b].y + bullets[b].height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    const knockbackStrength = 15;
                    enemies[e].vx = (dx / dist) * knockbackStrength;
                    enemies[e].vy = (dy / dist) * knockbackStrength;
                }

                // Remove the bullet
                bullets.splice(b, 1);

                // If enemy's HP <= 0, set them to 'die' instead of removing immediately
                if (enemies[e].hp <= 0 && !enemies[e].isDying) {
                    // Trigger the death animation
                    enemies[e].animationState = 'die';
                    enemies[e].frameIndex = 0;
                    enemies[e].frameTimer = 0;
                    enemies[e].isDying = true;
                    enemies[e].speed = 0;

                    // If you want to grant XP immediately, you can still call onKillEnemy here
                    onKillEnemy?.();
                }

                // Break out of enemy loop (this bullet is done)
                break;
            }
        }
    }
}
