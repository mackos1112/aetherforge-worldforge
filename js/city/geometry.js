// ── City Geometry Helpers ───────────────────────────────────────────────────

export function pointInPolygon(x, y, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function getPolygonArea(poly) {
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        area += (p1.x + p2.x) * (p1.y - p2.y);
    }
    return Math.abs(area / 2);
}

export function splitPolygon(poly, pX, pY, dx, dy) {
    const left = [];
    const right = [];
    
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        
        // Signed distance to split line: (x - pX)*dy - (y - pY)*dx
        const d1 = (p1.x - pX) * dy - (p1.y - pY) * dx;
        const d2 = (p2.x - pX) * dy - (p2.y - pY) * dx;
        
        if (d1 >= 0) {
            left.push(p1);
        } else {
            right.push(p1);
        }
        
        if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
            const vX = p2.x - p1.x;
            const vY = p2.y - p1.y;
            const denom = vX * dy - vY * dx;
            if (Math.abs(denom) > 1e-6) {
                const t = ((pX - p1.x) * dy - (pY - p1.y) * dx) / denom;
                if (t > 0 && t < 1) {
                    const intersect = {
                        x: p1.x + t * vX,
                        y: p1.y + t * vY
                    };
                    left.push(intersect);
                    right.push(intersect);
                }
            }
        }
    }
    return [left, right];
}

export function insetPolygon(poly, spacing) {
    const cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
    const cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
    
    return poly.map(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) return p;
        return {
            x: cx + dx * (1 - spacing / len),
            y: cy + dy * (1 - spacing / len)
        };
    });
}

export function subdivideBlock(poly, minArea, rng) {
    const area = getPolygonArea(poly);
    if (area < minArea || poly.length < 3) {
        return [poly];
    }

    const cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
    const cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    poly.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    const dx = maxX - minX;
    const dy = maxY - minY;

    let angle = 0;
    if (dx > dy) {
        angle = Math.PI / 2 + rng.range(-0.25, 0.25);
    } else {
        angle = rng.range(-0.25, 0.25);
    }

    const splitDx = Math.cos(angle);
    const splitDy = Math.sin(angle);

    const [left, right] = splitPolygon(poly, cx, cy, splitDx, splitDy);

    if (left.length < 3 || right.length < 3) {
        return [poly];
    }

    return [
        ...subdivideBlock(left, minArea, rng),
        ...subdivideBlock(right, minArea, rng)
    ];
}
