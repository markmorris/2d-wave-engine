// enemyTypes.js

export class BasicEnemy {
    constructor() {
        this.width = 32;
        this.height = 32;
        this.speed = 1.0;
        this.hp = 0;
        this.sprite = 'assets/basic_enemy.png';
        this.type = 'basic';
        this.isBoss = false;
        // Add more properties as needed
    }

    // Define methods specific to BasicEnemy
}

export class AdvancedEnemy {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.speed = 0.8;
        this.hp = 20;
        this.sprite = 'assets/advanced_enemy.png';
        this.type = 'advanced';
        this.isBoss = false;
        // Add more properties as needed
    }

    // Define methods specific to AdvancedEnemy
}

export class BossEnemy {
    constructor() {
        this.width = 64;
        this.height = 64;
        this.speed = 0.5;
        this.hp = 200;
        this.sprite = 'assets/boss_enemy.png';
        this.type = 'boss';
        this.isBoss = true;
        // Add unique properties for bosses
    }

    // Define boss-specific methods
}
