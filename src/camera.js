// camera.js
export const MAP_WIDTH = 3200;
export const MAP_HEIGHT = 3200;

export const camera = {
    x: 0,
    y: 0,
    width: 800,   // same as canvas width
    height: 600   // same as canvas height
};

/**
 * Center camera on the player, then clamp so we don't go beyond the map edges.
 */
export function updateCamera(player) {
    // Center the camera on the player
    camera.x = player.x - camera.width / 2;
    camera.y = player.y - camera.height / 2;

    // Clamp camera so it doesn't show outside the map
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - camera.height));
}

export function getCamera() {
    return camera;
}
