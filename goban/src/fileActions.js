'use strict';

// Shared new/load/save helpers for phone More menu and BesoGo file panel (issue #30).

var WARNING = 'Everything not saved will be lost';
var currentFileName = 'export.sgf';

function getCurrentFileName() {
    return currentFileName;
}

function setCurrentFileName(name) {
    if (name) {
        currentFileName = name;
    }
}

function newBoard(editor, size, confirmFn) {
    if (!editor || !size) {
        return { ok: false };
    }
    confirmFn = confirmFn || (typeof confirm !== 'undefined' ? confirm : function () { return true; });
    if (!confirmFn('New ' + size + 'x' + size + ' board?\n' + WARNING)) {
        return { ok: false, cancelled: true };
    }
    editor.loadRoot(besogo.makeGameRoot(size, size));
    editor.setGameInfo({});
    return { ok: true };
}

function loadSgfText(editor, text, alertFn) {
    if (!editor || text == null) {
        return { ok: false };
    }
    alertFn = alertFn || (typeof alert !== 'undefined' ? alert : function () {});
    var sgf;
    try {
        sgf = besogo.parseSgf(text);
    } catch (error) {
        alertFn('SGF parse error at ' + error.at + ':\n' + error.message);
        return { ok: false, parseError: true };
    }
    besogo.loadSgf(sgf, editor);
    return { ok: true };
}

function saveSgfDownload(editor, fileName, mount) {
    if (!editor) {
        return { ok: false };
    }
    var text = besogo.composeSgf(editor);
    var name = fileName || currentFileName || 'export.sgf';
    mount = mount || (typeof document !== 'undefined' ? document.body : null);
    if (mount) {
        var link = document.createElement('a');
        var blob = new Blob([text], { encoding: 'UTF-8', type: 'text/plain;charset=UTF-8' });
        link.download = name;
        link.href = URL.createObjectURL(blob);
        link.style.display = 'none';
        mount.appendChild(link);
        link.click();
        mount.removeChild(link);
    }
    return { ok: true, text: text, fileName: name };
}

var api = {
    WARNING: WARNING,
    getCurrentFileName: getCurrentFileName,
    setCurrentFileName: setCurrentFileName,
    newBoard: newBoard,
    loadSgfText: loadSgfText,
    saveSgfDownload: saveSgfDownload
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
if (typeof besogo !== 'undefined') {
    besogo.fileActions = api;
}
