// ShootAbility.js

import { Ability } from './Ability.js';
import { createBullet, bullets } from '../bullet.js';
import { playShootSound } from '../sound.js';
import { getNearestEnemy } from '../enemy.js';

export class WandAbility extends Ability {
    static abilityName = 'Wand';

    constructor() {
        super('Wand');
        this.attackCooldown = 1000;    // Cooldown in ms
        this.lastShotTime = 0;          // Timestamp of last shot
        this.attackDamage = 1;          // Damage per bullet
        this.attackRange = 250;         // Range to shoot
    }

    init(player) {
        this.player = player; // Reference to the player object
    }

    update(player, enemies, delta) {
        if (!this.unlocked) return;

        const now = performance.now();
        if (now - this.lastShotTime < this.attackCooldown) return;

        const nearest = getNearestEnemy(player);
        if (!nearest) return;

        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.attackRange) return; // Out of range

        // Calculate bullet velocity
        const bulletSpeed = 8;
        const vx = (dx / dist) * bulletSpeed;
        const vy = (dy / dist) * bulletSpeed;

        // Create and add the bullet
        bullets.push(createBullet({
            x: player.x + player.width / 2 - 4,
            y: player.y + player.height / 2 - 4,
            vx,
            vy,
            damage: this.attackDamage
        }));

        // Play shooting sound
        playShootSound();

        // Update last shot time
        this.lastShotTime = now;
    }

    // Method to upgrade damage
    upgradeDamage(factor) {
        this.attackDamage *= factor;
    }

    // Method to upgrade cooldown (reduce cooldown time)
    upgradeCooldown(factor) {
        this.attackCooldown = Math.max(50, this.attackCooldown * factor);
    }


    applyUpgradeEffect() {
        switch (this.level) {
            case 2:
                this.attackCooldown *= 0.90;
                break;
            case 3:
                this.attackDamage *= 1.2;
                break;
            case 4:
                this.attackCooldown *= 0.90;
                break;
            case 5:
                this.attackDamage *= 1.2;
                this.attackRange *= 1.25;
                break;
            // Continue up to level 10
            case 6:
                this.attackCooldown *= 0.90;
                break;
            case 7:
                this.attackDamage *= 1.3;
                break;
            case 8:
                this.attackCooldown *= 0.90;
                break;
            case 9:
                this.attackDamage *= 1.3;
                break;
            case 10:
                this.attackCooldown *= 0.80;
                this.attackDamage *= 1.5;
                this.attackRange *= 1.5;
                break;
            default:
                break;
        }
    }
}
