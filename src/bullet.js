// bullet.js handles bullet creation and updates

export const bullets = [];

// Factory function to create a bullet
export function createBullet({ x, y, vx, vy }) {
    return {
        x,
        y,
        width: 8,
        height: 8,
        vx,
        vy,
    };
}

// Update bullet positions
export function updateBullets(canvas) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // If bullet goes off screen, remove it
        if (
            b.x + b.width < 0 ||
            b.x > canvas.width ||
            b.y + b.height < 0 ||
            b.y > canvas.height
        ) {
            bullets.splice(i, 1);
        }
    }
}

// Draw bullets
export function drawBullets(ctx) {
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
}
