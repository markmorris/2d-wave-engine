/******************************************************
 * main.js - Updated with WaveManager Integration and Image Loading
 ******************************************************/
import {keys, setupInput} from './input.js';
import {initAudio} from './sound.js';
import {camera, MAP_HEIGHT, MAP_WIDTH, updateCamera} from './camera.js';
import {drawPlayer, player, updatePlayer} from './player.js';
import {drawEnemies, enemies, imagesPromise, updateEnemies} from './enemy.js'; // Import imagesPromise
import {bullets, drawBullets, updateBullets} from './bullet.js';
import {checkBulletEnemyCollisions, checkEnemyPlayerCollisions} from './collisions.js';
import {drawFPS} from './utils.js';
import {drawObstacles, spawnObstacles} from "./obstacles.js";
import {drawGems, updateGems} from "./gems.js";
import {WaveManager} from './waveManager.js'; // Import WaveManager
import {drawUI} from './ui.js'; // For HUD and UI elements

// -- Grab canvas and context --
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const floorTile = new Image();
floorTile.src = 'assets/grass.png'; // path to your 32x32 tile
let floorPattern = null;

// -- For normal FPS tracking (display only) --
let fps = 0;

// -- Initialize WaveManager
let waveManager = null;

// Function to load JSON (assuming waves.json is accessible)
async function loadWaveConfig() {
    try {
        const response = await fetch('/data/waves.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to load waves configuration:', error);
        return { waves: [] }; // Return empty waves to prevent errors
    }
}

// Wait until the floor tile image is loaded before creating the pattern
floorTile.onload = () => {
    // Create the pattern using a temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Assuming floorTile is 32x32, set the tempCanvas size accordingly
    // tempCanvas.width = floorTile.width;
    // tempCanvas.height = floorTile.height;

    // tempCtx.drawImage(floorTile, 0, 0);
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

/**
 * Initializes and starts the game.
 */
export async function startGame() {
    initAudio();
    setupInput();
    spawnObstacles(30); // e.g. 30 random blocks

    // Wait for all enemy images to load
    try {
        await imagesPromise;
        console.log('All enemy images loaded successfully.');
    } catch (error) {
        console.error('Error loading enemy images:', error);
        alert('Failed to load game assets. Please try reloading the page.');
        return;
    }

    // Load wave configurations
    const wavesConfig = await loadWaveConfig();
    if (wavesConfig.waves.length === 0) {
        console.error('No waves defined in waves.json. Game cannot start.');
        alert('No waves defined. Please check the waves configuration.');
        return;
    }

    // Initialize WaveManager with the loaded configuration
    waveManager = new WaveManager(wavesConfig);

    // Start the first wave
    waveManager.startNextWave();

    resetLastTime();
    isPaused = false;
    requestAnimationFrame(gameLoop);
}

// -- Our main update logic --
function update(delta) {
    // Update WaveManager
    waveManager.update(delta, player);

    // Update player (movement, auto-shoot, etc.)
    updatePlayer(delta, keys, canvas);

    // Update gems
    updateGems(delta);

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
}

// -- Our main draw logic --
function draw() {
    // Calculate remaining time for the current wave
    const timeLeft = Math.max(0, waveManager.waveTimer); // waveTimer is in seconds

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save current transform state
    ctx.save();

    // Apply negative camera offset, so camera.x/camera.y is the top-left
    ctx.translate(-camera.x, -camera.y);

    // 1) Draw the floor (using the pattern)
    drawFloor(ctx);

    // 2) Draw obstacles
    drawObstacles(ctx);

    // 3) Draw player
    drawPlayer(ctx);

    // 4) Draw enemies
    drawEnemies(ctx);

    // 5) Draw bullets
    drawBullets(ctx);

    // 6) Draw gems
    drawGems(ctx);

    // Restore transform so UI/HUD stays fixed
    ctx.restore();

    // 7) HUD and UI
    drawUI(ctx, waveManager, fps);

    // 8) Display current FPS
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

// -- Start the game loop --
// initGame();
