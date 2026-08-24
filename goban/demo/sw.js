/* eslint-disable no-restricted-globals */
// CACHE_VERSION: 6 — bump when demo shell or cached assets change.
'use strict';

var CACHE_VERSION = 6;
var CACHE_NAME = 'goban-demo-v' + CACHE_VERSION;

// Paths relative to the demo/ scope (works for local serve and GitHub Pages).
var PRECACHE = [
    'index.html',
    'manifest.json',
    '../src/tetherMath.js',
    '../src/modeMenu.js',
    '../vendor/besogo/css/besogo.css',
    '../vendor/besogo/css/besogo-fill.css',
    '../vendor/besogo/css/board-flat.css',
    '../vendor/besogo/js/besogo.js',
    '../vendor/besogo/js/editor.js',
    '../vendor/besogo/js/gameRoot.js',
    '../vendor/besogo/js/svgUtil.js',
    '../vendor/besogo/js/parseSgf.js',
    '../vendor/besogo/js/loadSgf.js',
    '../vendor/besogo/js/saveSgf.js',
    '../vendor/besogo/js/boardDisplay.js',
    '../vendor/besogo/js/coord.js',
    '../vendor/besogo/js/toolPanel.js',
    '../vendor/besogo/js/filePanel.js',
    '../vendor/besogo/js/controlPanel.js',
    '../vendor/besogo/js/namesPanel.js',
    '../vendor/besogo/js/commentPanel.js',
    '../vendor/besogo/js/treePanel.js',
    '../vendor/besogo/icon32.png',
    '../vendor/besogo/icon152.png',
    '../vendor/besogo/icon192.png',
    '../vendor/besogo/icon512.png',
    '../vendor/besogo/icon.svg',
    '../vendor/besogo/img/black0.png',
    '../vendor/besogo/img/black1.png',
    '../vendor/besogo/img/black2.png',
    '../vendor/besogo/img/black3.png',
    '../vendor/besogo/img/white0.png',
    '../vendor/besogo/img/white1.png',
    '../vendor/besogo/img/white2.png',
    '../vendor/besogo/img/white3.png',
    '../vendor/besogo/img/white4.png',
    '../vendor/besogo/img/white5.png',
    '../vendor/besogo/img/white6.png',
    '../vendor/besogo/img/white7.png',
    '../vendor/besogo/img/white8.png',
    '../vendor/besogo/img/white9.png',
    '../vendor/besogo/img/white10.png'
];

function scopeUrl(path) {
    return new URL(path, self.registration.scope).href;
}

function precacheUrls() {
    return PRECACHE.map(scopeUrl);
}

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(precacheUrls());
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (key) {
                return key.indexOf('goban-demo-v') === 0 && key !== CACHE_NAME;
            }).map(function (key) {
                return caches.delete(key);
            }));
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                var copy = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, copy);
                });
                return response;
            });
        }).catch(function () {
            if (event.request.mode === 'navigate') {
                return caches.match(scopeUrl('index.html'));
            }
        })
    );
});
