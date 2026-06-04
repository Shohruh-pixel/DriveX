// app/globals.js — создаёт window.DX, регистрирует React + htm
(() => {
  'use strict';
  if (!window.React || !window.ReactDOM || !window.htm) {
    console.error("DRIVEX: missing React/ReactDOM/htm"); return;
  }
  const React   = window.React;
  const ReactDOM = window.ReactDOM;
  const html    = window.htm.bind(React.createElement);
  const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = React;
  window.DX = window.DX || {};
  Object.assign(window.DX, {
    React, ReactDOM, html, useState, useEffect, useCallback,
    useMemo, useRef, createContext, useContext
  });

  // Mutable live refs — garage cars и saved places
  // utils-shim.js читает отсюда через window.garageCars и window.savedPlaces
  if (!window.DX._garageCarsRef) {
    let _gc = [];
    window.DX._garageCarsRef = {
      get val() { return _gc; },
      set val(v) { _gc = Array.isArray(v) ? v : []; }
    };
  }
  if (!window.DX._savedPlacesRef) {
    let _sp = [];
    window.DX._savedPlacesRef = {
      get val() { return _sp; },
      set val(v) { _sp = Array.isArray(v) ? v : []; }
    };
  }
})();
