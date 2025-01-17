// waveManager.js

import { spawnEnemy } from './enemy.js';

export class WaveManager {
    constructor(wavesConfig) {
        this.waves = wavesConfig.waves;
        this.currentWaveIndex = -1;
        this.waveTimer = 0;
        this.isWaveActive = false;
        this.spawnTimer = 0;
    }

    startNextWave() {
        this.currentWaveIndex++;
        if (this.currentWaveIndex >= this.waves.length) {
            console.log('All waves completed!');
            // Optionally, trigger end-game conditions or restart
            return;
        }

        const wave = this.waves[this.currentWaveIndex];
        this.waveTimer = wave.duration * 1000; // Convert duration from seconds to milliseconds
        this.spawnTimer = wave.spawnInterval * 1000; // Initialize spawnTimer based on spawnInterval in ms
        this.isWaveActive = true;

        console.log(`Starting Wave ${wave.waveNumber}`);
    }

    update(delta, player) {
        if (!this.isWaveActive) {
            this.startNextWave();
            return;
        }

        const wave = this.waves[this.currentWaveIndex];

        // Update wave timer
        this.waveTimer -= delta;
        if (this.waveTimer <= 0) {
            this.isWaveActive = false;
            console.log(`Wave ${wave.waveNumber} ended.`);
            return;
        }

        // Handle spawning
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            const spawned = spawnEnemy(wave.enemyType, player, wave);
            if (spawned) {
                this.spawnTimer = wave.spawnInterval * 1000; // Reset spawnTimer using spawnInterval in ms
            } else {
                // Max enemies for this wave reached
                // Do not reset spawnTimer to prevent unnecessary checks
                this.spawnTimer = 0;
            }
        }
    }
}
