import {enemies, getNearestEnemy} from './enemy.js';
import { createBullet, bullets } from './bullet.js';
import { setPaused, resetLastTime } from './main.js';
import {playShootSound} from "./sound.js";  // import our pause utilities
import { MAP_WIDTH, MAP_HEIGHT } from './camera.js';
import {isColliding} from "./utils.js";
import {obstacles} from "./obstacles.js";

// References to the level-up modal
const levelUpModal = document.getElementById('levelUpModal');
const skillPointsDisplay = document.getElementById('skillPointsDisplay');
const btnUpgradeAttack = document.getElementById('btnUpgradeAttack');
const btnUpgradeMove = document.getElementById('btnUpgradeMove');
const btnUpgradeMaxHP = document.getElementById('btnUpgradeMaxHP');
const btnUpgradeRange = document.getElementById('btnUpgradeRange');
const btnUpgradeGarlic = document.getElementById('btnUpgradeGarlic');

// Create Image objects
const idleImage = new Image();
idleImage.src = 'assets/idle.png'; // path to your idle sprite sheet

const walkImage = new Image();
walkImage.src = 'assets/walk.png'; // path to your walk sprite sheet

// The player object
export const player = {
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
    width: 32,
    height: 32,
    speed: 5,
    hp: 2,
    maxHP: 2,
    attackCooldown: 1000,
    lastShotTime: 0,
    kills: 0,

    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    skillPoints: 0,
    pickupRadius: 50,
    attackRange: 250,

    // Animation tracking
    animationState: 'idle',  // could be 'idle' or 'walk'
    frameIndex: 0,           // which frame we’re on
    frameTimer: 0,           // accumulates delta time (or steps)
    frameInterval: 10,       // how often to advance frame (bigger => slower anim)

    facingRight: true,       // if false, we flip horizontally

    // --- Garlic ability ---
    hasGarlic: true,    // or set to false if you want it unlockable later
    garlicRadius: 100,  // how far the garlic aura reaches
    garlicDPS: 1,       // how much damage per second to enemies in range
    garlicTickTimer: 0, // track time to do tick damage
    garlicTickInterval: 0.5, // do damage every 0.5 seconds
};

const ATTACK_SPEED_UP = 10;
const MOVE_SPEED_UP = 0.2;
const MAX_HP_UP = 2;

// For reference, each idle frame is 128x128, total frames = 5
const IDLE_FRAMES = 5;
const WALK_FRAMES = 6;
const SPRITE_SIZE = 128; // each frame is 128 wide, 128 tall

// Button event listeners
btnUpgradeAttack.addEventListener('click', () => {
    if (player.skillPoints > 0) {
        player.attackCooldown = Math.max(50, player.attackCooldown - ATTACK_SPEED_UP);
        player.skillPoints--;
        updateLevelUpUI();
    }
});

btnUpgradeMove.addEventListener('click', () => {
    if (player.skillPoints > 0) {
        player.speed += MOVE_SPEED_UP;
        player.skillPoints--;
        updateLevelUpUI();
    }
});

btnUpgradeMaxHP.addEventListener('click', () => {
    if (player.skillPoints > 0) {
        player.maxHP += MAX_HP_UP;
        player.hp = player.maxHP;
        player.skillPoints--;
        updateLevelUpUI();
    }
});

btnUpgradeRange.addEventListener('click', () => {
    if (player.skillPoints > 0) {
        // Increase attackRange by some amount, e.g. +50
        player.attackRange += 50;
        player.skillPoints--;
        updateLevelUpUI();
    }
});

btnUpgradeGarlic.addEventListener('click', () => {
    if (player.skillPoints > 0) {
        player.garlicRadius += 5;
        player.garlicDPS += 0.2;
        player.hasGarlic = true;
        player.skillPoints--;
        updateLevelUpUI();
    }
});

function updateAnimation(player) {
    player.frameTimer++;

    // If we exceed the interval, advance a frame
    if (player.frameTimer >= player.frameInterval) {
        player.frameTimer = 0;

        if (player.animationState === 'walk') {
            // cycle frames 0..(WALK_FRAMES-1)
            player.frameIndex = (player.frameIndex + 1) % WALK_FRAMES;
        } else {
            // 'idle' cycle 0..(IDLE_FRAMES-1)
            player.frameIndex = (player.frameIndex + 1) % IDLE_FRAMES;
        }
    }
}


// Called each frame by main.js
export function updatePlayer(delta, keys, canvas) {
    const oldX = player.x;
    const oldY = player.y;

    let moving = false;

    if (keys['ArrowLeft'] || keys['a']) {
        player.x -= player.speed;
        player.facingRight = false;
        moving = true;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x += player.speed;
        player.facingRight = true;
        moving = true;
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y -= player.speed;
        moving = true;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y += player.speed;
        moving = true;
    }

    // If we moved at all, set animation to 'walk', else 'idle'
    player.animationState = moving ? 'walk' : 'idle';

    // Constrain player to the new 3200x3200 map
    player.x = Math.max(0, Math.min(player.x, MAP_WIDTH - player.width));
    player.y = Math.max(0, Math.min(player.y, MAP_HEIGHT - player.height));

    // 4) Check if we collide with ANY obstacle
    for (let i = 0; i < obstacles.length; i++) {
        if (isColliding(player, obstacles[i])) {
            // If we collide, revert to old position
            player.x = oldX;
            player.y = oldY;
            break;
        }
    }

    // update the animation frames each tick
    updateAnimation(player);

    // Auto-shoot
    autoShoot();

    // After normal updates, do garlic logic
    if (player.hasGarlic) {
        updateGarlicAura(delta);
    }

    // If skill points > 0, show the level-up modal (and pause the game if not already paused)
    if (player.skillPoints > 0) {
        showLevelUpUI();
    }
}

function updateGarlicAura(delta) {
    player.garlicTickTimer += delta / 1000; // accumulate time in seconds

    if (player.garlicTickTimer >= player.garlicTickInterval) {
        player.garlicTickTimer = 0;
        const damageThisTick = player.garlicDPS * player.garlicTickInterval;

        enemies.forEach((enemy, i) => {
            // if the enemy is dying, skip it
            if (enemy.isDying) return;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If enemy is within garlic radius
            if (dist <= player.garlicRadius) {
                // 1) Apply damage
                enemy.hp -= damageThisTick;

                // 2) Check if the enemy dies
                if (enemy.hp <= 0) {
                    // Trigger the death animation
                    enemy.animationState = 'die';
                    enemy.frameIndex = 0;
                    enemy.frameTimer = 0;
                    enemy.isDying = true;
                    enemy.speed = 0;
                    onKillEnemy?.();
                } else {
                    // 3) Apply knockback, pushing them outward from the player
                    if (dist > 0) {
                        // small push each tick, adjust to taste
                        const knockbackStrength = 3;
                        enemy.vx += (dx / dist) * knockbackStrength;
                        enemy.vy += (dy / dist) * knockbackStrength;
                    }
                }
            }
        });
    }
}



export function drawPlayer(ctx) {
    // Pick the correct sheet
    let sheet = (player.animationState === 'walk') ? walkImage : idleImage;
    let frames = (player.animationState === 'walk') ? WALK_FRAMES : IDLE_FRAMES;

    const sourceX = player.frameIndex * SPRITE_SIZE;
    const sourceY = 0;

    // The final drawn size
    const drawWidth = SPRITE_SIZE;
    const drawHeight = SPRITE_SIZE;

    // Compute top-left draw position
    let drawX = player.x - 48; // example offset
    let drawY = player.y - 96;

    ctx.save();
    if (!player.facingRight) {
        // Flip horizontally around the player's center
        // so we translate to the player center, scale -1, then translate back
        ctx.translate(drawX + drawWidth / 2, drawY + drawHeight / 2);
        ctx.scale(-1, 1);
        ctx.translate(-(drawX + drawWidth / 2), -(drawY + drawHeight / 2));
    }

    // Now draw from the sprite
    ctx.drawImage(
        sheet,
        sourceX,
        sourceY,
        SPRITE_SIZE,
        SPRITE_SIZE,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );

    ctx.restore();

    // 2) If player.hasGarlic, draw a circle
    if (player.hasGarlic) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'; // yellowish
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            player.garlicRadius,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
    }
}


// Called when the player kills an enemy
export function onKillEnemy() {
    // const xpGain = 25;
    // gainXP(xpGain);
    player.kills++;
}

// Gain XP and check for level up
export function gainXP(amount) {
    player.xp += amount;
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);
        player.skillPoints += 3;
    }
}

// Show the UI and pause the game
function showLevelUpUI() {
    levelUpModal.style.display = 'block';
    setPaused(true);
    updateLevelUpUI();
}

// Hide the UI (if skillPoints are 0) and unpause
function hideLevelUpUI() {
    levelUpModal.style.display = 'none';
    // Reset the lastTime so delta won't jump
    resetLastTime();
    setPaused(false);
}

function updateLevelUpUI() {
    skillPointsDisplay.textContent = player.skillPoints;

    // If no points left, hide the menu & unpause
    if (player.skillPoints <= 0) {
        hideLevelUpUI();
    }
}

function autoShoot() {
    const now = performance.now();
    if (now - player.lastShotTime < player.attackCooldown) return;

    // Find the nearest enemy
    const nearest = getNearestEnemy(player);
    if (!nearest) return;

    // Calculate distance to nearest enemy
    const dx = nearest.x - player.x;
    const dy = nearest.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If the enemy is farther than our attack range, do NOT shoot
    if (dist > player.attackRange) {
        return; // Out of range, skip
    }

    // If in range, proceed to shoot
    player.lastShotTime = now;

    // same bullet creation logic as before
    const bulletSpeed = 8;
    const vx = (dx / dist) * bulletSpeed;
    const vy = (dy / dist) * bulletSpeed;

    bullets.push(createBullet({
        x: player.x + player.width / 2 - 4,
        y: player.y + player.height / 2 - 4,
        vx,
        vy
    }));

    // Play the shoot SFX
    playShootSound();
}

