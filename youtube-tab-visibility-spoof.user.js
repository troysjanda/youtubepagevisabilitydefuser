// ==UserScript==
// @name         YouTube Tab Visibility Spoof
// @namespace    https://github.com/userscripts
// @version      1.1
// @description  Prevents YouTube from detecting when the tab is out of focus or hidden
// @author       Troy Janda
// @match        *://www.youtube.com/*
// @match        *://youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // --- Page Visibility API ---
  // Spoof document.hidden and document.visibilityState to always report "visible"
  Object.defineProperty(document, 'hidden', {
    get: () => false,
    configurable: true,
  });

  Object.defineProperty(document, 'visibilityState', {
    get: () => 'visible',
    configurable: true,
  });

  // Block visibilitychange events from reaching YouTube's handlers
  const _addEventListener = document.addEventListener.bind(document);
  document.addEventListener = function (type, listener, options) {
    if (type === 'visibilitychange') return; // drop it
    return _addEventListener(type, listener, options);
  };

  // Intercept any events that do slip through and override the state
  _addEventListener('visibilitychange', (e) => {
    e.stopImmediatePropagation();
  }, true);

  // --- window focus/blur events ---
  // YouTube also listens on window blur/focus to pause background tabs
  const _winAddEventListener = window.addEventListener.bind(window);
  window.addEventListener = function (type, listener, options) {
    if (type === 'blur' || type === 'pagehide') return; // drop blur/pagehide
    return _winAddEventListener(type, listener, options);
  };

  // Intercept blur at capture phase so we can suppress it before handlers fire
  _winAddEventListener('blur', (e) => {
    e.stopImmediatePropagation();
  }, true);

  // Spoof document.hasFocus() to always return true
  Object.defineProperty(document, 'hasFocus', {
    value: () => true,
    configurable: true,
    writable: true,
  });

  // --- Intersection Observer (used for autoplay/pause detection) ---
  // Some YouTube player logic pauses when the player scrolls out of view;
  // override the observed ratio to always report fully visible.
  const _IntersectionObserver = window.IntersectionObserver;
  window.IntersectionObserver = function (callback, options) {
    const spoofedCallback = (entries, observer) => {
      const spoofed = entries.map((entry) => {
        return new Proxy(entry, {
          get(target, prop) {
            if (prop === 'intersectionRatio') return 1;
            if (prop === 'isIntersecting') return true;
            if (prop === 'intersectionRect') return target.boundingClientRect;
            return typeof target[prop] === 'function'
              ? target[prop].bind(target)
              : target[prop];
          },
        });
      });
      return callback(spoofed, observer);
    };
    return new _IntersectionObserver(spoofedCallback, options);
  };
  window.IntersectionObserver.prototype = _IntersectionObserver.prototype;

  console.log('[YT Visibility Spoof] Active — tab always appears visible.');
})();
