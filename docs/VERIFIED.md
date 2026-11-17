# MindPalace VR - Phase 0 Verification & Findings

## 1. IWSDK Scaffolding & Version Findings
- **Framework:** Meta Immersive Web SDK (`@iwsdk/core`) **v1.1.0** (Meta Platforms, Inc., MIT License).
- **Architecture:** High-performance Entity Component System (`elics`) natively unified with **Three.js** runtime.
- **Scaffold / Setup:** Built with standard Vite + TypeScript bundler. Core packages:
  - `@iwsdk/core` (includes `@iwsdk/xr-input`, `@iwsdk/locomotor`, `@pmndrs/uikit`, `@preact/signals-core`)
  - `three` (r170+ compatible runtime)
  - `typescript` & `vite`
- **Compatibility & Target:**
  - Modern WebXR-compliant browsers (Meta Quest Browser v50+, Chrome on Android with WebXR, desktop Chromium with WebXR extension / IWER).
  - WebXR `immersive-vr` session requires a secure context (**HTTPS** on Vercel or `localhost` during local dev).
  - Native desktop fallback: IWSDK automatically supports canvas pointer events and desktop emulation when not in an XR session.

## 2. WebXR Hand-Tracking APIs & IWSDK Interaction Systems
- **Standard WebXR Hand Input API:**
  - `XRHand` interface exposes 25 joint poses per tracked hand.
  - WebXR `hand-tracking` feature request passed to `XROptions` via `World.create()`.
- **IWSDK Native Input & Grab Systems:**
  - **`features.grabbing: { useHandPinchForGrab: true }`**: IWSDK natively handles direct pinch-to-grab tracking without writing manual joint-distance math!
  - **`OneHandGrabbable`**: Component for direct 6DoF spatial translation and rotation (configurable via `{ translate: true, rotate: true }`).
  - **`RayInteractable`**: Component marking an entity for ray pointer interaction (controller ray, hand ray, and mouse pointer).
  - **Transient State Tags**:
    - `Hovered`: Attached dynamically by `InputSystem` when pointer/hand ray intersects an interactable.
    - `Pressed`: Attached dynamically when pointer/pinch is active.
    - `Grabbed`: Attached dynamically by `GrabSystem` when an entity is grabbed, removed immediately on release.

## 3. XR Simulator Capabilities & Limitations
- **What IWER (Immersive Web Emulator) Can Demonstrate:**
  - 6DoF head pose tracking and room positioning.
  - Controller and simulated hand ray pointers, trigger/pinch clicks, grip events, and entity selection.
  - Desktop mouse/keyboard interaction fallback.
- **What Hardware Simulator Cannot Demonstrate:**
  - Full natural 25-joint continuous hand mesh deformation and finger occlusion in peripheral vision.
  - Sub-millimeter hand-tracking jitter, latency, or fast hand-movement tracking loss.
  - Physical ergonomics of prolonged seated hand interaction (arm fatigue, natural pinch radius).

## 4. Deployment Target Requirements
- **Hosting Platform:** Vercel (static asset hosting + Serverless API functions for Palace Agent).
- **Security:** Strict HTTPS (WebXR APIs are completely blocked over unencrypted HTTP).
- **Serverless Architecture:** `/api/agent` serverless endpoint to safely manage LLM calls and conceal API keys from client bundles.

## 5. Competition Rules Checklist
- **Track:** Productivity
- **Division:** New Experience
- **Special Award:** Best Agentic Interaction
- **Rule Verification Status:** Waiting for user to paste exact official rules text to verify specific compliance constraints (e.g., submission video requirements, package licenses, asset guidelines).
