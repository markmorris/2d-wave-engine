// waveLoader.js

export async function loadWaveConfig() {
    try {
        const response = await fetch('/data/waves.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const wavesConfig = await response.json();
        return wavesConfig;
    } catch (error) {
        console.error('Failed to load waves configuration:', error);
        return { waves: [] }; // Return empty waves to prevent errors
    }
}
