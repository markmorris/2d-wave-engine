// abilities/ChaosRiftsAbility.js

import { Ability } from './Ability.js';
import { enemies } from '../enemy.js'; // Assuming enemies are exported from enemy.js
import { isColliding } from '../utils.js'; // Collision detection utility
import { playRiftSpawnSound, playRiftDamageSound } from '../sound.js'; // Sound effects

export class ChaosRiftsAbility extends Ability {
    static abilityName = 'Chaos Rifts'; // Unique name for the ability

    constructor() {
        super(ChaosRiftsAbility.abilityName);

        // Rift Characteristics
        this.spawnInterval = 5000; // Initial spawn interval in milliseconds
        this.riftRadius = 80;      // Initial radius of each rift in pixels
        this.riftDuration = 7000;  // Duration each rift lasts in milliseconds
        this.riftDamagePerSecond = 5; // Damage dealt per second to enemies within rift

        // Upgrade Effects
        this.maxRifts = 1;          // Initial maximum number of active rifts
        this.spawnIntervalMin = 3000; // Minimum spawn interval after upgrades
        this.riftRadiusIncrement = 10; // Radius increase per upgrade
        this.riftDamageIncrement = 2;  // Damage increment per upgrade
        this.riftDurationIncrement = 1000; // Duration increment per upgrade

        // Rift Management
        this.activeRifts = [];      // Array to store active rifts
        this.lastSpawnTime = 0;     // Timestamp of the last rift spawn

        // Rift Visuals
        this.riftImage = new Image();
        this.riftImage.src = 'assets/rift.png'; // Path to your rift sprite/image

        // Ensure the image is loaded before use
        this.riftImage.onload = () => {
            this.riftImageLoaded = true;
        };
    }

    init(player) {
        this.player = player;
    }

    update(player, enemies, delta) {
        if (!this.unlocked) return;

        const currentTime = Date.now();

        // Spawn new rifts based on spawn interval and maximum allowed rifts
        if (
            currentTime - this.lastSpawnTime >= this.spawnInterval &&
            this.activeRifts.length < this.maxRifts
        ) {
            this.spawnRift();
            this.lastSpawnTime = currentTime;
        }

        // Update existing rifts
        this.activeRifts.forEach((rift, index) => {
            // Check if rift duration has elapsed
            if (currentTime - rift.spawnTime >= rift.duration) {
                // Remove expired rift
                this.activeRifts.splice(index, 1);
                return;
            }

            // Deal damage to enemies within the rift
            enemies.forEach(enemy => {
                if (enemy.isDying) return;

                const dx = enemy.x + enemy.width / 2 - rift.x;
                const dy = enemy.y + enemy.height / 2 - rift.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= rift.radius) {
                    // Calculate damage based on delta time
                    const damage = (this.riftDamagePerSecond * delta) / 1000;
                    enemy.hp -= damage;

                    // Play damage sound
                    playRiftDamageSound();

                    // Optional: Apply visual indicators or effects

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

    draw(ctx, player) {
        if (!this.unlocked) return;
        if (!this.riftImageLoaded) return; // Ensure image is loaded

        this.activeRifts.forEach(rift => {
            ctx.save();

            // Draw the rift image centered at (rift.x, rift.y)
            const drawX = rift.x - rift.radius;
            const drawY = rift.y - rift.radius;
            const diameter = rift.radius * 2;

            ctx.globalAlpha = 0.5; // Semi-transparent effect
            ctx.drawImage(this.riftImage, drawX, drawY, diameter, diameter);

            ctx.restore();
        });
    }

    applyUpgradeEffect() {
        // Define what each level upgrade does
        switch (this.level) {
            case 2:
                this.maxRifts = 2;
                break;
            case 3:
                this.riftDamagePerSecond += this.riftDamageIncrement;
                break;
            case 4:
                this.riftRadius += this.riftRadiusIncrement;
                break;
            case 5:
                this.spawnInterval = Math.max(
                    this.spawnIntervalMin,
                    this.spawnInterval - 500
                ); // Decrease spawn interval
                break;
            case 6:
                this.maxRifts = 3;
                break;
            case 7:
                this.riftDamagePerSecond += this.riftDamageIncrement;
                break;
            case 8:
                this.riftRadius += this.riftRadiusIncrement;
                break;
            case 9:
                this.spawnInterval = Math.max(
                    this.spawnIntervalMin,
                    this.spawnInterval - 500
                );
                break;
            case 10:
                this.maxRifts = 4;
                this.riftDamagePerSecond += this.riftDamageIncrement;
                this.riftRadius += this.riftRadiusIncrement;
                this.spawnInterval = Math.max(
                    this.spawnIntervalMin,
                    this.spawnInterval - 500
                );
                break;
            default:
                break;
        }

        // After applying upgrade, reset all rifts to maintain even spacing if necessary
        this.resetRifts();
    }

    /**
     * Spawns a new rift at a random location around the player within a specified radius.
     */
    spawnRift() {
        const spawnDistanceMin = 150; // Minimum distance from player
        const spawnDistanceMax = 300; // Maximum distance from player

        // Random angle in radians
        const angle = Math.random() * Math.PI * 2;

        // Random distance within the min and max spawn distance
        const distance =
            spawnDistanceMin +
            Math.random() * (spawnDistanceMax - spawnDistanceMin);

        // Calculate spawn position
        const x = this.player.x + this.player.width / 2 + distance * Math.cos(angle);
        const y = this.player.y + this.player.height / 2 + distance * Math.sin(angle);

        // Create new rift object
        const rift = {
            x,
            y,
            radius: this.riftRadius,
            duration: this.riftDuration,
            spawnTime: Date.now(),
        };

        // Add to active rifts
        this.activeRifts.push(rift);

        // Play spawn sound
        playRiftSpawnSound();
    }

    /**
     * Resets all active rifts to ensure even spacing (optional based on design).
     * This method can be enhanced to smoothly transition existing rifts.
     */
    resetRifts() {
        // Optional: Implement smooth transitions if desired
        // For simplicity, we'll remove all existing rifts upon upgrade
        this.activeRifts = [];
        // Optionally, spawn new rifts immediately or let them spawn naturally
    }
}
