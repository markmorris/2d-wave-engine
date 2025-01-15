// abilities/GarlicAbility.js

import { Ability } from './Ability.js';
import { onKillEnemy } from '../player.js';

export class GarlicAbility extends Ability {
    static abilityName = 'Garlic';
    constructor() {
        super('Garlic');
        this.garlicRadius = 100;
        this.garlicDPS = 1;
        this.garlicTickInterval = 500; // ms
        this.garlicTickTimer = 0;
    }

    init(player) {
        this.player = player;
    }

    update(player, enemies, delta) {
        if (!this.unlocked) return;

        this.garlicTickTimer += delta;

        if (this.garlicTickTimer >= this.garlicTickInterval) {
            this.garlicTickTimer = 0;
            const damageThisTick = this.garlicDPS * (this.garlicTickInterval / 1000);

            enemies.forEach((enemy) => {
                if (enemy.isDying) return;

                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= this.garlicRadius) {
                    enemy.hp -= damageThisTick;

                    if (enemy.hp <= 0) {
                        enemy.animationState = 'die';
                        enemy.frameIndex = 0;
                        enemy.frameTimer = 0;
                        enemy.isDying = true;
                        onKillEnemy?.();
                    } else {
                        enemy.vx = (dx / dist) * 3;
                        enemy.vy = (dy / dist) * 3;
                    }
                }
            });
        }
    }

    draw(ctx, player) {
        if (!this.unlocked) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'; // Yellowish aura
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            this.garlicRadius,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
    }

    applyUpgradeEffect() {
        // Define what each level upgrade does
        switch (this.level) {
            case 2:
                this.garlicRadius *= 1.1; // Increase radius by 10%
                break;
            case 3:
                this.garlicDPS *= 1.2; // Increase DPS by 20%
                break;
            case 4:
                this.garlicRadius *= 1.1;
                break;
            case 5:
                this.garlicDPS *= 1.2;
                break;
            // Continue up to level 10
            // Example:
            case 6:
                this.garlicRadius *= 1.1;
                break;
            case 7:
                this.garlicDPS *= 1.2;
                break;
            case 8:
                this.garlicRadius *= 1.1;
                break;
            case 9:
                this.garlicDPS *= 1.2;
                break;
            case 10:
                // Max level: perhaps add a final bonus
                this.garlicRadius *= 1.1;
                this.garlicDPS *= 1.2;
                break;
            default:
                break;
        }
    }
}
