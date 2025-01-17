// ShieldAbility.js

import { Ability } from './Ability.js';



export class ShieldAbility extends Ability {
    static abilityName = 'Shield';
    constructor() {
        super('Shield');
        this.shieldDuration = 3000;      // Duration in ms
        this.shieldCooldown = 10000;     // Cooldown in ms
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.lastShieldTime = 0;
        this.damageReduction = 0.5;      // 50% damage reduction
    }

    init(player) {
        this.player = player; // Reference to the player object
    }

    update(player, enemies, delta) {
        if (!this.unlocked) return;

        const now = performance.now();

        if (!this.shieldActive && (now - this.lastShieldTime) >= this.shieldCooldown) {
            // Activate shield
            this.shieldActive = true;
            this.shieldTimer = this.shieldDuration;
            this.lastShieldTime = now;
            // Optionally, apply immediate effects or trigger visual feedback
        }

        if (this.shieldActive) {
            this.shieldTimer -= delta;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                // Remove shield effects or visual feedback
            }
        }
    }

    // Draw the shield
    // draw(ctx, player) {
    //
    // }

    // Method to upgrade shield properties
    upgradeDuration(factor) {
        this.shieldDuration *= factor;
    }

    upgradeCooldown(factor) {
        this.shieldCooldown = Math.max(1000, this.shieldCooldown * factor); // Minimum 1s
    }

    upgradeDamageReduction(factor) {
        this.damageReduction *= factor; // e.g., 0.5 to 0.6 for 60% reduction
    }

    applyUpgradeEffect() {
        switch (this.level) {
            case 2:
                this.shieldDuration *= 1.1; // Increase duration by 10%
                break;
            case 3:
                this.damageReduction += 0.05; // Increase damage reduction by 5%
                break;
            case 4:
                this.shieldCooldown *= 0.95; // Reduce cooldown by 5%
                break;
            case 5:
                this.shieldDuration *= 1.1;
                break;
            case 6:
                this.damageReduction += 0.05;
                break;
            case 7:
                this.shieldCooldown *= 0.95;
                break;
            case 8:
                this.shieldDuration *= 1.1;
                break;
            case 9:
                this.damageReduction += 0.05;
                break;
            case 10:
                this.shieldCooldown *= 0.95;
                this.damageReduction += 0.05;
                break;
            default:
                break;
        }

        // Ensure that damageReduction does not exceed a logical maximum, e.g., 0.9 (90%)
        if (this.damageReduction > 0.9) {
            this.damageReduction = 0.9;
        }
    }
}
