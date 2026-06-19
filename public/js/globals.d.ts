/**
 * @file public/js/globals.d.ts
 * @description Extends the browser Window interface with the two libraries
 * loaded via <script> tags (PixiJS and GSAP).
 *
 * These libraries set window.PIXI and window.gsap at load time.
 * Declaring them here gives the TypeScript checker full intellisense
 * without requiring module imports in each consumer file.
 */

import type * as PIXI from "pixi.js";
/// <reference types="gsap" />

declare global {
  interface Window {
    /** PixiJS global, injected by /vendor/pixi.js/dist/pixi.min.js */
    PIXI: typeof PIXI;
    /** GSAP global, injected by /vendor/gsap/dist/gsap.min.js */
    gsap: typeof gsap;
  }

  /** Socket.IO client, injected by /socket.io/socket.io.js */
  function io(...args: any[]): any;
}
