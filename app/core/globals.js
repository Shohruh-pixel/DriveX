// app/core/globals.js — DX namespace bootstrap
// Sets up window.DX with React, htm, hooks, and sellerBackend reference
(() => {
  "use strict";

  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const htm = window.htm;

  if (!React || !ReactDOM || !htm) {
    console.error("DRIVEX (React): missing React/ReactDOM/htm.");
    return;
  }

  const {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
  } = React;

  const html = htm.bind(React.createElement);
  const sellerBackend = window.DrivexSellerBackend || null;

  window.DX = window.DX || {};

  Object.assign(window.DX, {
    React,
    ReactDOM,
    htm,
    html,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    sellerBackend
  });

  // ─── React Context для разделения состояния между файлами ───────────
  // AppContext.Provider оборачивает всё приложение в App()
  // Экраны в отдельных файлах используют useAppCtx() чтобы читать state
  const AppContext = createContext({});
  DX.AppContext = AppContext;
  DX.useAppCtx = function() {
    return useContext(AppContext);
  };
})();
