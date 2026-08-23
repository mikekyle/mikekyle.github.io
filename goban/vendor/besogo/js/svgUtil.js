(function() {
'use strict';

// Color palette
besogo.RED  = '#be0119'; // Darker red (marked variant)
besogo.LRED = '#ff474c'; // Lighter red (auto-marked variant)
besogo.BLUE = '#0165fc'; // Bright blue (last move)
besogo.PURP = '#9a0eea'; // Red + blue (variant + last move)
besogo.GREY = '#929591'; // Between white and black
besogo.GOLD = '#dbb40c'; // Tool selection
besogo.TURQ = '#06c2ac'; // Turqoise (nav selection)

besogo.BLACK_STONES = 4; // Number of black stone images
besogo.WHITE_STONES = 11; // Number of white stone images

// Makes an SVG element with given name and attributes
besogo.svgEl = function(name, attributes) {
    var attr, // Scratch iteration variable
        element = document.createElementNS("http://www.w3.org/2000/svg", name);

    for ( attr in (attributes || {}) ) { // Add attributes if supplied
        if (attributes.hasOwnProperty(attr)) {
            element.setAttribute(attr, attributes[attr]);
        }
    }
    return element;
};

// Makes an SVG group for containing the shadow layer
besogo.svgShadowGroup = function() {
    var group = besogo.svgEl('g'),
        filter = besogo.svgEl('filter', { id: 'blur' }),
        blur = besogo.svgEl('feGaussianBlur', {
            in: 'SourceGraphic',
            stdDeviation: '2'
        });

    filter.appendChild(blur);
    group.appendChild(filter);
    return group;
};

// Makes a stone shadow
besogo.svgShadow = function(x, y) {
    return besogo.svgEl("circle", {
        cx: x,
        cy: y,
        r: 43,
        stroke: 'none',
        fill: 'black',
        opacity: 0.32,
        filter: 'url(#blur)'
    });
};

// Makes a photo realistic stone element
besogo.realStone = function(x, y, color, index) {
    var element;

    if (color < 0) {
        color = 'black' + (index % besogo.BLACK_STONES);
    } else {
        color = 'white' + (index % besogo.WHITE_STONES);
    }
    color = 'img/' + color + '.png';

    element =  besogo.svgEl("image", {
        x: (x - 44),
        y: (y - 44),
        height: 88,
        width: 88
    });
    element.setAttributeNS('http://www.w3.org/1999/xlink', 'href', color);

    return element;
};

// Makes a stone element
besogo.svgStone = function(x, y, color) {
    var className = "besogo-svg-greyStone"; // Grey stone by default

    if (color === -1) { // Black stone
        className = "besogo-svg-blackStone";
    } else if (color === 1) { // White stone
        className = "besogo-svg-whiteStone";
    }

    return besogo.svgEl("circle", {
        cx: x,
        cy: y,
        r: 42,
        'class': className
    });
};

// Makes a circle at (x, y)
besogo.svgCircle = function(x, y, color) {
    return besogo.svgEl("circle", {
        cx: x,
        cy: y,
        r: 27,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};

// Makes a square at (x, y)
besogo.svgSquare = function(x, y, color) {
    return besogo.svgEl("rect", {
        x: (x - 23),
        y: (y - 23),
        width: 46,
        height: 46,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};

// Makes an equilateral triangle at (x, y)
besogo.svgTriangle = function(x, y, color) {
    // Approximates an equilateral triangle centered on (x, y)
    var pointString = "" + x + "," + (y - 30) + " " +
        (x - 26) + "," + (y + 15) + " " +
        (x + 26) + "," + (y + 15);

    return besogo.svgEl("polygon", {
        points: pointString,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};

// Makes an "X" cross at (x, y)
besogo.svgCross = function(x, y, color) {
    var path = "m" + (x - 24) + "," + (y - 24) + "l48,48m0,-48l-48,48";

    return besogo.svgEl("path", {
        d: path,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};

// Makes an "+" plus sign at (x, y)
besogo.svgPlus = function(x, y, color) {
    var path = "m" + x + "," + (y - 28) + "v56m-28,-28h56";

    return besogo.svgEl("path", {
        d: path,
        stroke: color,
        "stroke-width": 8,
        fill: "none"
    });
};

// Makes a small filled square at (x, y)
besogo.svgBlock = function(x, y, color) {
    return besogo.svgEl("rect", {
        x: x - 18,
        y: y - 18,
        width: 36,
        height: 36,
        stroke: "none",
        "stroke-width": 8,
        fill: color
    });
};

// Makes a label at (x, y)
besogo.svgLabel = function(x, y, color, label) {
    var element,
        size;

    // Trims label to 3 characters
    if (label.length > 3) {
        label = label.slice(0, 2) + '…';
    }

    // Set font size according to label length
    switch(label.length) {
        case 1:
            size = 72;
            break;
        case 2:
            size = 56;
            break;
        case 3:
            size = 36;
            break;
    }

    element = besogo.svgEl("text", {
        x: x,
        y: y,
        dy: ".65ex", // Seems to work for vertically centering these fonts
        "font-size": size,
        "text-anchor": "middle", // Horizontal centering
        "font-family": "Helvetica, Arial, sans-serif",
        fill: color
    });
    element.appendChild( document.createTextNode(label) );

    return element;
};

// Yin-yang used for the auto-play tool (shared with the phone mode menu).
besogo.svgYinYang = function(x, y) {
    var element = besogo.svgEl('g');

    element.appendChild(besogo.svgEl("path", {
        d: "m" + x + "," + (y - 44) + " a44 44 0 0 1 0,88z",
        stroke: "none",
        fill: "black"
    }));
    element.appendChild(besogo.svgEl("path", {
        d: "m" + x + "," + (y + 44) + "a44 44 0 0 1 0,-88a22 22 0 0 1 0,44z",
        stroke: "none",
        fill: "white"
    }));
    element.appendChild(besogo.svgEl("circle", {
        cx: x,
        cy: y + 22,
        r: 22,
        stroke: "none",
        fill: "black"
    }));
    return element;
};

// Browse / navOnly glyph.
besogo.svgEye = function(x, y) {
    var element = besogo.svgEl('g');
    element.appendChild(besogo.svgEl('ellipse', {
        cx: x,
        cy: y,
        rx: 40,
        ry: 22,
        stroke: 'black',
        'stroke-width': 6,
        fill: 'none'
    }));
    element.appendChild(besogo.svgEl('circle', {
        cx: x,
        cy: y,
        r: 12,
        stroke: 'none',
        fill: 'black'
    }));
    return element;
};

// Append a tool glyph into an SVG whose viewBox is centered on (0, 0).
besogo.drawToolGlyph = function(svg, tool) {
    var element = besogo.svgEl('g');

    switch (tool) {
        case 'navOnly':
            element.appendChild(besogo.svgEye(0, 0));
            break;
        case 'addB':
            element.appendChild(besogo.svgStone(0, 0, -1));
            break;
        case 'addW':
            element.appendChild(besogo.svgStone(0, 0, 1));
            break;
        case 'addE':
            element.appendChild(besogo.svgStone(0, 0));
            element.appendChild(besogo.svgCross(0, 0, besogo.RED));
            break;
        case 'circle':
            element.appendChild(besogo.svgCircle(0, 0, 'black'));
            break;
        case 'square':
            element.appendChild(besogo.svgSquare(0, 0, 'black'));
            break;
        case 'triangle':
            element.appendChild(besogo.svgTriangle(0, 0, 'black'));
            break;
        case 'cross':
            element.appendChild(besogo.svgCross(0, 0, 'black'));
            break;
        case 'block':
            element.appendChild(besogo.svgBlock(0, 0, 'black'));
            break;
        case 'clrMark':
            element.appendChild(besogo.svgTriangle(0, 0, besogo.GREY));
            element.appendChild(besogo.svgCross(0, 0, besogo.RED));
            break;
        case 'label':
            element.appendChild(besogo.svgLabel(0, 0, 'black', 'A1'));
            break;
        case 'pass':
            element.appendChild(besogo.svgLabel(0, 0, 'black', 'P'));
            break;
        case 'relocate':
            element.appendChild(besogo.svgEl('line', {
                x1: 0, y1: -36, x2: 0, y2: 36,
                stroke: 'black', 'stroke-width': 6
            }));
            element.appendChild(besogo.svgEl('polygon', {
                points: '-44,0 -14,-16 -14,16',
                stroke: 'none',
                fill: 'black'
            }));
            element.appendChild(besogo.svgEl('polygon', {
                points: '44,0 14,-16 14,16',
                stroke: 'none',
                fill: 'black'
            }));
            break;
        default:
            element.appendChild(besogo.svgYinYang(0, 0));
            break;
    }
    svg.appendChild(element);
    return element;
};

})(); // END closure
