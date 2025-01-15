// player.js

import { enemies } from './enemy.js';
import { setPaused, resetLastTime } from './main.js';
import { MAP_WIDTH, MAP_HEIGHT } from './camera.js';
import { isColliding } from "./utils.js";
import { obstacles } from "./obstacles.js";
import { WandAbility } from './abilities/WandAbility.js';
import { GarlicAbility } from './abilities/GarlicAbility.js';
import { ShieldAbility } from "./abilities/ShieldAbility.js";
import { AllAbilities } from './abilities/AbilityRegistry.js'; // Import the registry

// References to the level-up modal
const levelUpModal = document.getElementById('levelUpModal');
// Create Image objects
const idleImage = new Image();
idleImage.src = 'assets/idle.png';

const walkImage = new Image();
walkImage.src = 'assets/walk.png';

// The player object
export const player = {
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
    width: 32,
    height: 32,
    speed: 5,
    hp: 100,
    maxHP: 100,
    kills: 0,

    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    pickupRadius: 50,
    attackRange: 250,

    // Animation tracking
    animationState: 'idle',  // could be 'idle' or 'walk'
    frameIndex: 0,           // which frame we’re on
    frameTimer: 0,           // accumulates delta time (or steps)
    frameInterval: 10,       // how often to advance frame (bigger => slower anim)

    facingRight: true,       // if false, we flip horizontally

    // --- Abilities ---
    abilities: [],            // List of ability instances

    // Initialize abilities
    initAbilities: function() {
        // Initialize ShootAbility
        const wandAbility = new WandAbility();
        wandAbility.unlock(); // Unlock by default; modify as needed
        // wandAbility.init(this);
        this.abilities.push(wandAbility);

        // Initialize GarlicAbility
        const garlicAbility = new GarlicAbility();
        garlicAbility.unlocked = false; // Unlock by default; modify as needed
        this.abilities.push(garlicAbility);

        // Initialize ShieldAbility (initially locked)
        const shieldAbility = new ShieldAbility();
        shieldAbility.unlocked = false; // Set unlocked to false explicitly
        // shieldAbility.init(this);
        this.abilities.push(shieldAbility);
    }
};

// Initialize abilities when the script loads
player.initAbilities();

// Constants for animation frames
const IDLE_FRAMES = 5;
const WALK_FRAMES = 6;
const SPRITE_SIZE = 128; // each frame is 128 wide, 128 tall

// Function to update animation frames
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

    // Update the animation frames each tick
    updateAnimation(player);

    // Update abilities
    player.abilities.forEach(ability => {
        ability.update(player, enemies, delta);
    });

    // After normal updates, do any other logic
    // For passive abilities like GarlicAura, their effects are handled in their update methods
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

    // Draw ability-related visuals, e.g., Garlic Aura
    player.abilities.forEach(ability => {
        if (ability.unlocked) {

            if (ability.abilityName === 'Garlic') {
                // Existing Garlic Aura drawing logic
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)'; // yellowish
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                    ability.garlicRadius,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
            }

            if (ability.abilityName === 'Shield' && ability.shieldActive) {
                // Draw Shield Aura
                ctx.save();
                ctx.strokeStyle = 'rgba(0, 0, 255, 0.6)'; // blueish
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                    150, // Example radius; adjust as needed
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
            }

            // Add more passive ability visuals as needed
        }
    });

    // Draw player pickup radius
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)'; // magenta
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        player.x + player.width / 2,
        player.y + player.height / 2,
        player.pickupRadius,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();

    // Draw player attack range
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)'; // cyan
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        player.x + player.width / 2,
        player.y + player.height / 2,
        player.attackRange,
        0,
        Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
}

// Called when the player kills an enemy
export function onKillEnemy() {
    player.kills++;
}

// Function to get two random abilities
function getRandomAbilities() {
    const availableAbilities = AllAbilities.filter(AbilityClass => {
        const existing = player.abilities.find(a => a.name === AbilityClass.abilityName);
        return !existing || (existing && existing.level < existing.maxLevel);
    });

    if (availableAbilities.length < 2) {
        return availableAbilities;
    }

    // Shuffle and pick the first two abilities
    const shuffled = availableAbilities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
}

// Function to handle level-up and ability selection
function handleLevelUp() {
    const abilityChoices = getRandomAbilities();

    if (abilityChoices.length === 0) {
        alert('Congratulations! All abilities are maxed out.');
        return;
    }

    // Get the modal and buttons dynamically
    const levelUpModal = document.getElementById('levelUpModal');
    const abilityOption1 = document.getElementById('abilityOption1');
    const abilityOption2 = document.getElementById('abilityOption2');

    // Set the button texts to the actual ability names
    abilityOption1.textContent = abilityChoices[0].abilityName;
    abilityOption2.textContent = abilityChoices[1].abilityName;

    // Show the modal
    levelUpModal.style.display = 'block';

    // Handle button clicks
    abilityOption1.onclick = () => {
        chooseAbility(abilityChoices[0]);
        levelUpModal.style.display = 'none';
    };

    abilityOption2.onclick = () => {
        chooseAbility(abilityChoices[1]);
        levelUpModal.style.display = 'none';
    };
}

function updateAbilitiesDisplay() {
    // const abilitiesDisplay = document.getElementById('abilitiesDisplay');
    // if (!abilitiesDisplay) return; // Ensure the element exists

    const abilitiesList = document.getElementById('abilitiesList');
    abilitiesList.innerHTML = ''; // Clear existing list

    player.abilities.forEach(ability => {
        if (ability.unlocked) {
            const listItem = document.createElement('li');
            listItem.textContent = `${ability.name} (Level ${ability.level})`;
            abilitiesList.appendChild(listItem);
        }
    });
}


// Call this function whenever abilities are added or upgraded
function chooseAbility(AbilityClass) {
    const abilityName = AbilityClass.abilityName;
    const existingAbility = player.abilities.find(a => a.name === abilityName);

    if (existingAbility) {
        if (existingAbility.unlocked) {
            // Upgrade the existing ability
            existingAbility.upgrade();
            // alert(`You have upgraded ${abilityName} to level ${existingAbility.level}!`);
        } else {
            // Unlock the ability
            existingAbility.unlock();
            existingAbility.init(player); // Initialize any necessary properties upon unlocking
            // alert(`You have unlocked ${abilityName}!`);
        }
    } else {
        console.error(`Ability ${abilityName} not found in player abilities.`);
    }

    // Update abilities display
    updateAbilitiesDisplay();
}


// Modify `gainXP` to trigger `handleLevelUp` when leveling up
export function gainXP(amount) {
    player.xp += amount;
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.2);

        // Handle level-up ability selection
        handleLevelUp();
    }
}