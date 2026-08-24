'use strict';

// Phone More menu data + apply (issue #30). DOM-free so Node tests can drive actions.

var fileActions = (typeof module !== 'undefined' && module.exports)
    ? require('./fileActions')
    : (typeof besogo !== 'undefined' ? besogo.fileActions : null);

var ITEMS = [
    { id: 'new', label: 'New' },
    { id: 'load', label: 'Load' },
    { id: 'save', label: 'Save' },
    { id: 'fullUi', label: 'Full UI' }
];

var NEW_SIZES = [
    { id: 'new9', size: 9, label: '9×9' },
    { id: 'new13', size: 13, label: '13×13' },
    { id: 'new19', size: 19, label: '19×19' },
    { id: 'back', label: 'Back' }
];

function cloneItems(list) {
    return list.map(function (item) {
        var copy = { id: item.id, label: item.label };
        if (item.size) {
            copy.size = item.size;
        }
        return copy;
    });
}

function items() {
    return cloneItems(ITEMS);
}

function newSizes() {
    return cloneItems(NEW_SIZES);
}

function findItem(id) {
    var i, item;
    for (i = 0; i < ITEMS.length; i++) {
        if (ITEMS[i].id === id) {
            return ITEMS[i];
        }
    }
    for (i = 0; i < NEW_SIZES.length; i++) {
        if (NEW_SIZES[i].id === id) {
            return NEW_SIZES[i];
        }
    }
    return null;
}

function applyChoice(editor, itemOrId, opts) {
    var item = typeof itemOrId === 'string' ? findItem(itemOrId) : itemOrId;
    if (!item || !editor || !fileActions) {
        return { applied: false, close: false };
    }

    if (item.id === 'new') {
        return { applied: true, close: false, showSubmenu: 'new' };
    }
    if (item.id === 'back') {
        return { applied: true, close: false, showSubmenu: null };
    }
    if (item.id === 'load') {
        return { applied: true, close: false, triggerLoad: true };
    }
    if (item.id === 'save') {
        var saved = fileActions.saveSgfDownload(editor, fileActions.getCurrentFileName());
        return { applied: saved.ok, close: saved.ok };
    }
    if (item.id === 'fullUi') {
        return { applied: true, close: true, openFullUi: true };
    }
    if (item.size) {
        opts = opts || {};
        var created = fileActions.newBoard(editor, item.size, opts.confirm);
        return {
            applied: created.ok,
            close: created.ok,
            cancelled: !!created.cancelled
        };
    }
    return { applied: false, close: false };
}

var api = {
    items: items,
    newSizes: newSizes,
    findItem: findItem,
    applyChoice: applyChoice
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
if (typeof besogo !== 'undefined') {
    besogo.moreMenu = api;
}
