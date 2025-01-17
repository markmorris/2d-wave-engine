// abilities/OrbAbility.js

import { Ability } from './Ability.js';
import { enemies } from '../enemy.js'; // Assuming enemies are exported from enemy.js
import { isColliding } from '../utils.js'; // Collision detection utility
import { playDamageSound } from '../sound.js'; // Sound effect for orb hit

export class OrbAbility extends Ability {
    static abilityName = 'Orb of Wrath'; // Unique name for the ability

    constructor() {
        super(OrbAbility.abilityName);

        // Orbit Characteristics
        this.orbitRadius = 100; // Initial radius in pixels
        this.orbitSpeed = 90;   // Degrees per second
        this.numberOfOrbs = 2;  // Initial number of orbs

        // Orb Management
        this.orbs = []; // Stores the current angle of each orb in degrees

        // Orb Attributes
        this.orbImage = new Image();
        this.orbImage.src = 'assets/orb.png'; // Path to your orb sprite

        this.orbSize = 32;       // Size of each orb in pixels
        this.orbDamage = 10;     // Damage dealt per hit
        this.orbKnockback = 5;   // Knockback strength

        // Cooldown Management to prevent multiple hits per orbit
        this.orbCooldown = 1000; // 1 second cooldown in milliseconds
        this.orbLastHit = [];    // Tracks last hit time for each orb
    }

    init(player) {
        this.player = player;

        // Initialize orbs with evenly spaced angles
        this.resetOrbs();
    }

    // **Added Method**
    resetOrbs() {
        this.orbs = [];
        this.orbLastHit = [];
        for (let i = 0; i < this.numberOfOrbs; i++) {
            const angle = (360 / this.numberOfOrbs) * i;
            this.orbs.push(angle);
            this.orbLastHit.push(0); // Reset last hit time for each orb
        }
    }

    update(player, enemies, delta) {
        if (!this.unlocked) return;

        // Update each orb's angle
        for (let i = 0; i < this.orbs.length; i++) {
            // Increment angle based on orbitSpeed and delta time
            this.orbs[i] += (this.orbitSpeed * delta) / 1000; // delta is in ms
            this.orbs[i] %= 360; // Keep angle within [0, 360)
        }

        // Check for collisions between orbs and enemies
        this.checkOrbCollisions(player, enemies, delta);
    }

    draw(ctx, player) {
        if (!this.unlocked) return;
        if (!this.orbImage.complete) return; // Ensure image is loaded

        this.orbs.forEach((angle, index) => {
            // Convert angle to radians for calculation
            const rad = angle * (Math.PI / 180);

            // Calculate orb position relative to the player
            const orbX = player.x + player.width / 2 + this.orbitRadius * Math.cos(rad) - this.orbSize / 2;
            const orbY = player.y + player.height / 2 + this.orbitRadius * Math.sin(rad) - this.orbSize / 2;

            ctx.save();
            ctx.drawImage(this.orbImage, orbX, orbY, this.orbSize, this.orbSize);
            ctx.restore();
        });
    }

    applyUpgradeEffect() {
        // Define what each level upgrade does
        switch (this.level) {
            case 2:
                this.numberOfOrbs = 3;
                this.resetOrbs(); // Evenly distribute all orbs
                break;
            case 3:
                this.orbitSpeed += 15; // Increase speed by 15 degrees/sec
                break;
            case 4:
                this.numberOfOrbs = 4;
                this.resetOrbs(); // Evenly distribute all orbs
                break;
            case 5:
                this.orbitSpeed += 15;
                break;
            case 6:
                this.numberOfOrbs = 5;
                this.resetOrbs(); // Evenly distribute all orbs
                break;
            case 7:
                this.orbitSpeed += 15;
                break;
            case 8:
                this.numberOfOrbs = 6;
                this.resetOrbs(); // Evenly distribute all orbs
                break;
            case 9:
                this.orbitSpeed += 15;
                break;
            case 10:
                this.numberOfOrbs = 7;
                this.resetOrbs(); // Evenly distribute all orbs
                this.orbitSpeed += 15; // Final speed boost
                break;
            default:
                break;
        }
    }

    /**
     * Checks for collisions between each orb and all enemies.
     * @param {Object} player - Player object.
     * @param {Array} enemies - Array of enemy objects.
     * @param {number} delta - Time delta in milliseconds.
     */
    checkOrbCollisions(player, enemies, delta) {
        const currentTime = Date.now();

        enemies.forEach((enemy, enemyIndex) => {
            if (enemy.isDying) return; // Skip dying enemies

            this.orbs.forEach((angle, orbIndex) => {
                // Implement cooldown to prevent multiple hits within orbCooldown
                if (currentTime - this.orbLastHit[orbIndex] < this.orbCooldown) return;

                // Calculate orb position
                const rad = angle * (Math.PI / 180);
                const orbX = player.x + player.width / 2 + this.orbitRadius * Math.cos(rad);
                const orbY = player.y + player.height / 2 + this.orbitRadius * Math.sin(rad);

                // Simple circular collision detection (assuming circular enemies)
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                const distance = Math.sqrt(Math.pow(orbX - enemyCenterX, 2) + Math.pow(orbY - enemyCenterY, 2));

                // Define collision radius (orb size / 2 + enemy size / 2)
                const collisionRadius = this.orbSize / 2 + Math.max(enemy.width, enemy.height) / 2;

                if (distance <= collisionRadius) {
                    // Collision detected
                    enemy.hp -= this.orbDamage;
                    playDamageSound(); // Play sound effect

                    // Apply knockback away from the player
                    const dx = enemyCenterX - (player.x + player.width / 2);
                    const dy = enemyCenterY - (player.y + player.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        enemy.vx += (dx / dist) * this.orbKnockback;
                        enemy.vy += (dy / dist) * this.orbKnockback;
                    }

                    // Update last hit time
                    this.orbLastHit[orbIndex] = currentTime;

                    // Check if enemy is dead
                    if (enemy.hp <= 0 && !enemy.isDying) {
                        enemy.animationState = 'die';
                        enemy.frameIndex = 0;
                        enemy.frameTimer = 0;
                        enemy.isDying = true;
                        // Optionally, handle onKillEnemy or other callbacks here
                    }
                }
            });
        });
    }
}
