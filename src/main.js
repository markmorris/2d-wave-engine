/******************************************************
 * main.js - Example with a 60 FPS cap
 ******************************************************/
import { keys, setupInput } from './input.js';
import { initAudio } from './sound.js';
import {
    player,
    updatePlayer,
    drawPlayer
} from './player.js';
import {
    enemies,
    spawnWave,
    updateEnemies,
    drawEnemies
} from './enemy.js';
import {
    bullets,
    updateBullets,
    drawBullets
} from './bullet.js';
import {
    checkEnemyPlayerCollisions,
    checkBulletEnemyCollisions
} from './collisions.js';
import { drawFPS } from './utils.js';

// -- Grab canvas and context --
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// -- For normal FPS tracking (display only) --
let fps = 0;

// -- Wave info --
let waveNumber = 1;
let enemiesToSpawn = 3;

// -- Player stats (kill count, etc.) --
let kills = 0;

// -- Pause control (for level-up menus, etc.) --
export let isPaused = false;

// Functions so other modules can pause/unpause the game
export function setPaused(value) {
    isPaused = value;
}

export function resetLastTime() {
    lastFrameTime = performance.now();
}

export function startGame()
{
    initAudio();
    setupInput();
    spawnWave(enemiesToSpawn, waveNumber, canvas.width);

    isPaused = false;
    resetLastTime();
    requestAnimationFrame(gameLoop);
}

// -- Our main update logic --
function update(delta) {
    // Update player (movement, auto-shoot, etc.)
    updatePlayer(delta, keys, canvas);

    // Move and update enemies
    updateEnemies(delta, player);

    // Move and update bullets
    updateBullets(canvas);

    // Check collisions: enemy vs. player
    checkEnemyPlayerCollisions(player, enemies, () => {
        alert('Game Over! You were hit twice.');
        window.location.reload();
    });

    // Check collisions: bullets vs. enemies
    kills += checkBulletEnemyCollisions(bullets, enemies, player);

    // If wave is cleared, spawn the next
    if (enemies.length === 0) {
        waveNumber++;
        enemiesToSpawn++;
        spawnWave(enemiesToSpawn, waveNumber, canvas.width);
    }
}

// -- Our main draw logic --
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    drawPlayer(ctx);

    // Draw enemies
    drawEnemies(ctx);

    // Draw bullets
    drawBullets(ctx);

    // HUD
    ctx.fillStyle = 'black';
    ctx.font = '16px monospace';
    ctx.fillText(`HP: ${player.hp}/${player.maxHP}`, 10, 40);
    ctx.fillText(`Wave: ${waveNumber}`, 10, 60);
    ctx.fillText(`Kills: ${kills}`, 10, 80);
    ctx.fillText(`Lvl: ${player.level} (XP: ${player.xp}/${player.xpToNextLevel})`, 10, 100);
    ctx.fillText(`SkillPts: ${player.skillPoints}`, 10, 120);
    ctx.fillText(`Attack CD: ${player.attackCooldown}ms`, 10, 140);

    // Display current FPS
    drawFPS(ctx, fps, 10, 20);
}

/******************************************************
 * FPS Capping Logic
 ******************************************************/
// Desired framerate
let targetFPS = 60;
let fpsInterval = 1000 / targetFPS; // ~16.6667 ms per frame
let lastFrameTime = 0;              // store the time of the last rendered frame

// -- The main game loop --
function gameLoop(timestamp) {
    // If the game is paused (e.g., level-up menu shown), skip logic
    if (!isPaused) {
        // Check if enough time has passed since the last frame
        if (timestamp < lastFrameTime + fpsInterval) {
            // Not enough time, skip this frame
            requestAnimationFrame(gameLoop);
            return;
        }

        // Calculate how much time actually elapsed
        const delta = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        // Calculate actual FPS for display
        fps = 1000 / delta;

        // Run the update and draw
        update(delta);
        draw();
    }

    // Schedule the next frame
    requestAnimationFrame(gameLoop);
}

// -- Start the loop --
// requestAnimationFrame(gameLoop);
