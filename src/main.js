/******************************************************
 * main.js - Example with a 60 FPS cap
 ******************************************************/
import { keys, setupInput } from './input.js';
import { initAudio } from './sound.js';
import {camera, MAP_HEIGHT, MAP_WIDTH, updateCamera} from './camera.js';
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
import {drawObstacles, spawnObstacles} from "./obstacles.js";
import {drawGems, updateGems} from "./gems.js";

// -- Grab canvas and context --
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const floorTile = new Image();
floorTile.src = 'assets/floor.jpg'; // path to your 32x32 tile
let floorPattern = null;

// -- For normal FPS tracking (display only) --
let fps = 0;

// -- Wave info --
let waveNumber = 1;
let enemiesToSpawn = 12;
const timeBetweenWaves = 10000; // e.g. 30 seconds
let lastWaveTime = 0;

// Wait until the image is loaded before creating the pattern
floorTile.onload = () => {
    // We'll need a canvas or a context to call createPattern
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // create the pattern
    floorPattern = tempCtx.createPattern(floorTile, 'repeat');
};

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
    spawnObstacles(30); // e.g. 30 random blocks
    spawnWave(enemiesToSpawn, waveNumber);
    lastWaveTime = performance.now();      // mark time

    isPaused = false;
    resetLastTime();
    requestAnimationFrame(gameLoop);
}

// -- Our main update logic --
function update(delta) {
    // Update player (movement, auto-shoot, etc.)
    updatePlayer(delta, keys, canvas);

    // Update gems
    updateGems();

    // Now update the camera to center on the player
    updateCamera(player);

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
    checkBulletEnemyCollisions(bullets, enemies, player);

    const now = performance.now();
    if (enemies.length === 0 || now - lastWaveTime >= timeBetweenWaves) {
        waveNumber++;
        enemiesToSpawn++;
        spawnWave(enemiesToSpawn, waveNumber);
        lastWaveTime = now;
    }
}

// -- Our main draw logic --
function draw() {
    const now = performance.now();
    const timeLeft = Math.max(0, timeBetweenWaves - (now - lastWaveTime));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save current transform state
    ctx.save();

    // Apply negative camera offset, so camera.x/camera.y is the top-left
    ctx.translate(-camera.x, -camera.y);

    // 1) Draw the floor (3200x3200) using the pattern
    drawFloor(ctx);

    drawObstacles(ctx);

    // Draw player
    drawPlayer(ctx);

    // Draw enemies
    drawEnemies(ctx);

    // Draw bullets
    drawBullets(ctx);

    // Draw gems
    drawGems(ctx);

    // Restore transform so UI/HUD stays fixed
    ctx.restore();

    // HUD
    ctx.fillStyle = 'black';
    ctx.font = '16px monospace';
    ctx.fillText(`HP: ${player.hp}/${player.maxHP}`, 10, 40);
    ctx.fillText(`Wave: ${waveNumber}`, 10, 60);
    ctx.fillText(`Kills: ${player.kills}`, 10, 80);
    ctx.fillText(`Lvl: ${player.level} (XP: ${player.xp}/${player.xpToNextLevel})`, 10, 100);
    ctx.fillText(`SkillPts: ${player.skillPoints}`, 10, 120);
    ctx.fillText(`Attack Speed: ${player.attackCooldown}ms`, 10, 140);
    ctx.fillText(`Attack Range: ${player.attackRange}`, 10, 160);
    ctx.fillText(`Attack Damage: ${player.attackDamage}`, 10, 180);
    ctx.fillText(`Garlic Aura: ${player.garlicRadius}`, 10, 200);
    ctx.fillText(`Garlic DPS: ${player.garlicDPS}`, 10, 220);
    ctx.fillText(`Next Wave in: ${Math.ceil(timeLeft / 1000)}s`, 10, 240);

    // Display current FPS
    drawFPS(ctx, fps, 10, 20);
}

function drawFloor(ctx) {
    if (!floorPattern) return; // pattern not ready yet

    ctx.save();
    ctx.fillStyle = floorPattern;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ctx.restore();
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
