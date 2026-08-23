'use strict';

// Phone mode picker data + apply (issue #23). DOM-free so Node tests can drive setTool.

var GROUPS = [
    {
        id: 'play',
        title: 'Play / replay',
        items: [
            { id: 'auto', kind: 'tool', tool: 'auto', label: 'Play' },
            { id: 'navOnly', kind: 'tool', tool: 'navOnly', label: 'Browse' },
            { id: 'pass', kind: 'pass', tool: 'pass', label: 'Pass' }
        ]
    },
    {
        id: 'markup',
        title: 'Markup',
        items: [
            { id: 'circle', kind: 'tool', tool: 'circle', label: 'Circle' },
            { id: 'square', kind: 'tool', tool: 'square', label: 'Square' },
            { id: 'triangle', kind: 'tool', tool: 'triangle', label: 'Triangle' },
            { id: 'cross', kind: 'tool', tool: 'cross', label: 'Cross' },
            { id: 'block', kind: 'tool', tool: 'block', label: 'Block' },
            { id: 'clrMark', kind: 'tool', tool: 'clrMark', label: 'Clear mark' },
            { id: 'label', kind: 'tool', tool: 'label', label: 'Label' }
        ]
    },
    {
        id: 'edit',
        title: 'Edit',
        items: [
            { id: 'addB', kind: 'tool', tool: 'addB', label: 'Black' },
            { id: 'addW', kind: 'tool', tool: 'addW', label: 'White' },
            { id: 'addE', kind: 'tool', tool: 'addE', label: 'Empty' },
            { id: 'relocate', kind: 'tool', tool: 'relocate', label: 'Relocate' }
        ]
    }
];

function cloneGroups() {
    return GROUPS.map(function (group) {
        return {
            id: group.id,
            title: group.title,
            items: group.items.map(function (item) {
                return {
                    id: item.id,
                    kind: item.kind,
                    tool: item.tool,
                    label: item.label
                };
            })
        };
    });
}

function findItem(id) {
    var g, i, item;
    for (g = 0; g < GROUPS.length; g++) {
        for (i = 0; i < GROUPS[g].items.length; i++) {
            item = GROUPS[g].items[i];
            if (item.id === id) {
                return item;
            }
        }
    }
    return null;
}

function addItem(groupId, item) {
    var g, i;
    for (g = 0; g < GROUPS.length; g++) {
        if (GROUPS[g].id === groupId) {
            for (i = 0; i < GROUPS[g].items.length; i++) {
                if (GROUPS[g].items[i].id === item.id) {
                    GROUPS[g].items[i] = item;
                    return item;
                }
            }
            GROUPS[g].items.push(item);
            return item;
        }
    }
    return null;
}

function applyPass(editor) {
    var tool = editor.getTool();
    if (tool !== 'navOnly' && tool !== 'auto' && tool !== 'playB' && tool !== 'playW') {
        editor.setTool('auto');
    }
    editor.click(0, 0, false, false);
}

function applyChoice(editor, itemOrId) {
    var item = typeof itemOrId === 'string' ? findItem(itemOrId) : itemOrId;
    if (!item || !editor) {
        return { applied: false, close: false, tool: editor ? editor.getTool() : null };
    }
    if (item.kind === 'pass') {
        applyPass(editor);
        return { applied: true, close: true, tool: editor.getTool() };
    }
    if (item.kind === 'tool' && item.tool) {
        editor.setTool(item.tool);
        return { applied: true, close: true, tool: editor.getTool() };
    }
    return { applied: false, close: false, tool: editor.getTool() };
}

function isSelected(editor, item) {
    return !!(item && item.kind === 'tool' && editor && editor.getTool() === item.tool);
}

function glyphTool(itemOrTool) {
    if (!itemOrTool) {
        return 'auto';
    }
    if (typeof itemOrTool === 'string') {
        return itemOrTool;
    }
    return itemOrTool.tool || 'auto';
}

var api = {
    groups: cloneGroups,
    findItem: findItem,
    addItem: addItem,
    applyChoice: applyChoice,
    isSelected: isSelected,
    glyphTool: glyphTool
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
if (typeof besogo !== 'undefined') {
    besogo.modeMenu = api;
}
