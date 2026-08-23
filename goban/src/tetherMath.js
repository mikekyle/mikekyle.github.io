'use strict';

// Pure tether placement math (BW-Go press-drag-lift). Used by boardDisplay and Node tests.

var CELL_SIZE = 88;
var COORD_MARGIN = 75;
var EXTRA_MARGIN = 6;
var DEFAULT_RETARGET_HYSTERESIS = 0.35;
var DEFAULT_LIFT_FILTER_PX = 8;
// BW-Go v2 tether: hold-to-arm, then vector-offset reposition (issue #19).
var DEFAULT_HOLD_THRESHOLD_MS = 300;
var DEFAULT_STOP_DISTANCE_PX = 96; // ~1 inch / 25 mm at typical phone DPI
var DEFAULT_STOP_MOVEMENT_PX = 4;
var DEFAULT_STOP_DEBOUNCE_MS = 100;
// First line owns ~65% of the cell between lines 1 and 2 toward the interior (WeiqiHub edge policy).
var FIRST_LINE_INWARD_BIAS = 0.65;
// When line 2 is occupied, extend first-line priority further inward to stop ghost flicker.
var FIRST_LINE_STONE_COLLISION_BIAS = 0.75;

function boardMargin(coordMargin, extraMargin) {
    return (coordMargin !== undefined ? coordMargin : COORD_MARGIN) +
        (extraMargin !== undefined ? extraMargin : EXTRA_MARGIN);
}

function svgPos(i, cellSize, margin) {
    var cs = cellSize !== undefined ? cellSize : CELL_SIZE;
    var m = margin !== undefined ? margin : boardMargin();
    return m + cs / 2 + (i - 1) * cs;
}

function svgToGrid(svgX, svgY, cellSize, margin) {
    var cs = cellSize !== undefined ? cellSize : CELL_SIZE;
    var m = margin !== undefined ? margin : boardMargin();
    return {
        gx: (svgX - m - cs / 2) / cs + 1,
        gy: (svgY - m - cs / 2) / cs + 1
    };
}

// Snap one grid axis with first/last-line priority (see FIRST_LINE_* constants above).
function snapEdgeAxis(g, size, lowInnerOccupied, highInnerOccupied) {
    var lowThreshold = lowInnerOccupied ?
            FIRST_LINE_STONE_COLLISION_BIAS : FIRST_LINE_INWARD_BIAS,
        highThreshold = highInnerOccupied ?
            FIRST_LINE_STONE_COLLISION_BIAS : FIRST_LINE_INWARD_BIAS,
        distLow, distHigh, distInnerLow, distInnerHigh;

    if (g >= 1 && g < 2) {
        distLow = g - 1;
        distInnerLow = 2 - g;
        if (distLow <= distInnerLow || g < 1 + lowThreshold) {
            return 1;
        }
        return 2;
    }

    if (g > size - 1 && g <= size) {
        distHigh = size - g;
        distInnerHigh = g - (size - 1);
        if (distHigh <= distInnerHigh || g > size - highThreshold) {
            return size;
        }
        return size - 1;
    }

    return Math.round(g);
}

function nearestIntersectionFromSvg(svgX, svgY, sizeX, sizeY, options) {
    var grid = svgToGrid(svgX, svgY, options && options.cellSize, options && options.boardMargin),
        gx = grid.gx,
        gy = grid.gy,
        hysteresis = (options && options.retargetHysteresis !== undefined) ?
            options.retargetHysteresis : DEFAULT_RETARGET_HYSTERESIS,
        prevI = options && options.prevI,
        prevJ = options && options.prevJ,
        hasStone = options && options.hasStone,
        dx, dy, i, j,
        probeI, probeJ;

    if (prevI && prevJ) {
        dx = gx - prevI;
        dy = gy - prevJ;
        if (dx * dx + dy * dy < hysteresis * hysteresis) {
            return { i: prevI, j: prevJ };
        }
    }

    // Edge hit-test policy (WeiqiHub / phone yose): first line is sticky toward the
    // bezel — wider inward, wins when the finger is closer to line 1 than line 2, and
    // extends further when line 2 already has a stone (avoids ghost flicker).
    probeI = Math.max(1, Math.min(sizeX, Math.round(gx)));
    probeJ = Math.max(1, Math.min(sizeY, Math.round(gy)));

    i = snapEdgeAxis(gx, sizeX,
        hasStone && hasStone(2, probeJ),
        hasStone && hasStone(sizeX - 1, probeJ));
    j = snapEdgeAxis(gy, sizeY,
        hasStone && hasStone(probeI, 2),
        hasStone && hasStone(probeI, sizeY - 1));

    if (i < 1 || i > sizeX || j < 1 || j > sizeY) {
        return null;
    }
    return { i: i, j: j };
}

function ghostDisplayPosFromSvg(i, j, fingerSvgX, fingerSvgY, sizeX, sizeY, options) {
    var cs = (options && options.cellSize) || CELL_SIZE,
        margin = (options && options.boardMargin) !== undefined ?
            options.boardMargin : boardMargin(),
        ix = svgPos(i, cs, margin),
        iy = svgPos(j, cs, margin),
        dx, dy, distSq, ghostX, ghostY, offset, minX, maxX, minY, maxY;

    if (fingerSvgX === undefined || fingerSvgY === undefined) {
        return { x: ix, y: iy };
    }

    dx = ix - fingerSvgX;
    dy = iy - fingerSvgY;
    distSq = dx * dx + dy * dy;
    if (distSq < (cs * 0.4) * (cs * 0.4)) {
        offset = cs * 0.75;
        ghostX = ix;
        ghostY = iy;

        // Offset away from the finger; on edges, nudge inward so the ghost stays visible.
        if (j === 1) {
            ghostY = iy + offset * 0.55;
        } else if (j === sizeY) {
            ghostY = iy - offset * 0.55;
        } else {
            ghostY = iy - offset;
        }

        if (i === 1) {
            ghostX = ix + offset * 0.55;
        } else if (i === sizeX) {
            ghostX = ix - offset * 0.55;
        }

        minX = svgPos(1, cs, margin);
        maxX = svgPos(sizeX, cs, margin);
        minY = svgPos(1, cs, margin);
        maxY = svgPos(sizeY, cs, margin);
        ghostX = Math.max(minX, Math.min(maxX, ghostX));
        ghostY = Math.max(minY, Math.min(maxY, ghostY));
        return { x: ghostX, y: ghostY };
    }
    return { x: ix, y: iy };
}

function isLiftTwitch(liftDx, liftDy, thresholdPx) {
    var t = thresholdPx !== undefined ? thresholdPx : DEFAULT_LIFT_FILTER_PX;
    return liftDx * liftDx + liftDy * liftDy < t * t;
}

function distanceSq(dx, dy) {
    return dx * dx + dy * dy;
}

function hasReachedStopDistance(fromX, fromY, toX, toY, thresholdPx) {
    var t = thresholdPx !== undefined ? thresholdPx : DEFAULT_STOP_DISTANCE_PX;
    return distanceSq(toX - fromX, toY - fromY) >= t * t;
}

function isMovementBelowThreshold(dx, dy, thresholdPx) {
    var t = thresholdPx !== undefined ? thresholdPx : DEFAULT_STOP_MOVEMENT_PX;
    return distanceSq(dx, dy) < t * t;
}

// Fixed finger→stone offset locked when the finger first stops after dragging away.
function fingerStoneOffset(aimSvgX, aimSvgY, controlFingerSvgX, controlFingerSvgY) {
    return {
        offsetX: aimSvgX - controlFingerSvgX,
        offsetY: aimSvgY - controlFingerSvgY
    };
}

function ghostPosFromOffset(fingerSvgX, fingerSvgY, offsetX, offsetY) {
    return { x: fingerSvgX + offsetX, y: fingerSvgY + offsetY };
}

// Snap ghost SVG position to nearest intersection on commit.
function commitIntersectionFromGhostSvg(ghostSvgX, ghostSvgY, sizeX, sizeY, options) {
    return nearestIntersectionFromSvg(ghostSvgX, ghostSvgY, sizeX, sizeY, options);
}

var api = {
    CELL_SIZE: CELL_SIZE,
    COORD_MARGIN: COORD_MARGIN,
    EXTRA_MARGIN: EXTRA_MARGIN,
    DEFAULT_RETARGET_HYSTERESIS: DEFAULT_RETARGET_HYSTERESIS,
    DEFAULT_LIFT_FILTER_PX: DEFAULT_LIFT_FILTER_PX,
    DEFAULT_HOLD_THRESHOLD_MS: DEFAULT_HOLD_THRESHOLD_MS,
    DEFAULT_STOP_DISTANCE_PX: DEFAULT_STOP_DISTANCE_PX,
    DEFAULT_STOP_MOVEMENT_PX: DEFAULT_STOP_MOVEMENT_PX,
    DEFAULT_STOP_DEBOUNCE_MS: DEFAULT_STOP_DEBOUNCE_MS,
    FIRST_LINE_INWARD_BIAS: FIRST_LINE_INWARD_BIAS,
    FIRST_LINE_STONE_COLLISION_BIAS: FIRST_LINE_STONE_COLLISION_BIAS,
    boardMargin: boardMargin,
    svgPos: svgPos,
    svgToGrid: svgToGrid,
    snapEdgeAxis: snapEdgeAxis,
    nearestIntersectionFromSvg: nearestIntersectionFromSvg,
    ghostDisplayPosFromSvg: ghostDisplayPosFromSvg,
    isLiftTwitch: isLiftTwitch,
    distanceSq: distanceSq,
    hasReachedStopDistance: hasReachedStopDistance,
    isMovementBelowThreshold: isMovementBelowThreshold,
    fingerStoneOffset: fingerStoneOffset,
    ghostPosFromOffset: ghostPosFromOffset,
    commitIntersectionFromGhostSvg: commitIntersectionFromGhostSvg
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
if (typeof besogo !== 'undefined') {
    besogo.tetherMath = api;
}
