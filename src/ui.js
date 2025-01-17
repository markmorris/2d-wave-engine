// ui.js

/**
 * Draws the HUD and UI elements on the canvas.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
 * @param {WaveManager} waveManager - Instance of WaveManager.
 * @param {number} fps - Current frames per second.
 */
export function drawUI(ctx, waveManager, fps) {
    // Example: Display current wave and timer
    if (waveManager.currentWaveIndex >= 0 && waveManager.currentWaveIndex < waveManager.waves.length) {
        const wave = waveManager.waves[waveManager.currentWaveIndex];
        ctx.fillStyle = 'black';
        ctx.font = '16px monospace';
        ctx.fillText(`Wave: ${wave.waveNumber}`, 10, 30);
        ctx.fillText(`Time Left: ${Math.ceil(waveManager.waveTimer)}s`, 10, 50);
    }

    // Add more UI elements as needed, e.g., player stats, score, etc.
}

/**
 * Displays a wave start indicator (e.g., "Wave 1 Starting!").
 * @param {number} waveNumber - Number of the wave starting.
 */
export function showWaveStartUI(waveNumber) {
    // Implement visual indicators such as flashing text, animations, etc.
    const waveIndicator = document.createElement('div');
    waveIndicator.innerText = `Wave ${waveNumber} Starting!`;
    waveIndicator.style.position = 'absolute';
    waveIndicator.style.top = '50%';
    waveIndicator.style.left = '50%';
    waveIndicator.style.transform = 'translate(-50%, -50%)';
    waveIndicator.style.color = 'red';
    waveIndicator.style.fontSize = '40px';
    waveIndicator.style.fontWeight = 'bold';
    waveIndicator.style.pointerEvents = 'none';
    waveIndicator.style.opacity = '1';
    waveIndicator.style.transition = 'opacity 2s';
    document.body.appendChild(waveIndicator);

    // Fade out the indicator after a short duration
    setTimeout(() => {
        waveIndicator.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(waveIndicator);
        }, 2000);
    }, 1000);
}
