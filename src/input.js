// input.js manages keyboard input

export const keys = {};

// Attach event listeners
export function setupInput() {
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
}
