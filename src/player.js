import { getNearestEnemy } from './enemy.js';
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

    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    skillPoints: 0,

    attackRange: 250,
};

const ATTACK_SPEED_UP = 50;
const MOVE_SPEED_UP = 0.5;
const MAX_HP_UP = 1;

// Button event listeners
btnUpgradeAttack.addEventListener('click', () => {
    if (player.skillPoints > 0) {
        player.attackCooldown = Math.max(200, player.attackCooldown - ATTACK_SPEED_UP);
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

// Called each frame by main.js
export function updatePlayer(delta, keys, canvas) {
    // 1) Remember old position
    const oldX = player.x;
    const oldY = player.y;

    // Move
    if (keys['ArrowLeft'] || keys['a']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y += player.speed;
    }

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

    // Auto-shoot
    autoShoot();

    // If skill points > 0, show the level-up modal (and pause the game if not already paused)
    if (player.skillPoints > 0) {
        showLevelUpUI();
    }
}

export function drawPlayer(ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Called when the player kills an enemy
export function onKillEnemy() {
    const xpGain = 25;
    gainXP(xpGain);
}

// Gain XP and check for level up
function gainXP(amount) {
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

