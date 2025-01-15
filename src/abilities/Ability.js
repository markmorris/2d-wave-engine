// class/Ability.js

export class Ability {
    constructor(name) {
        this.name = name;
        this.unlocked = false;
        this.level = 1; // Start at level 1
        this.maxLevel = 10;
    }

    init(player) {
        // Initialization logic if needed
    }

    update(player, enemies, delta) {
        // To be overridden by subclasses
    }

    draw(ctx, player) {
        // To be overridden by subclasses for visuals
    }

    unlock() {
        this.unlocked = true;
    }

    // Method to upgrade the ability
    upgrade() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.applyUpgradeEffect();
            console.log(`${this.name} upgraded to level ${this.level}`);
        } else {
            console.log(`${this.name} is already at max level.`);
        }
    }

    // Define in subclasses: what happens when the ability is upgraded
    applyUpgradeEffect() {
        // To be implemented by subclasses
    }
}
