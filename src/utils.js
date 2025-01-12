// A place for utility functions

// Simple AABB collision check
export function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + (a.width || 0) > b.x &&
        a.y < b.y + b.height &&
        a.y + (a.height || 0) > b.y
    );
}

// Draw FPS in the top-left corner
export function drawFPS(ctx, fps, x = 10, y = 20) {
    ctx.fillStyle = 'black';
    ctx.font = '16px monospace';
    ctx.fillText(`FPS: ${fps.toFixed(1)}`, x, y);
}
