# MindPalace VR

> **"Your mind. Your space. Your memories."**

An immersive, hands-first spatial knowledge management environment built for the **Meta VR Start Developer Competition 2026**.

[![Platform: Meta Quest](https://img.shields.io/badge/Platform-Meta%20Quest%202%20%7C%203%20%7C%203S%20%7C%20Pro-0668E1?logo=meta)](https://www.meta.com/quest/)
[![SDK: Meta IWSDK](https://img.shields.io/badge/SDK-Meta%20Immersive%20Web%20SDK%20v1.1.0-blueviolet)](https://github.com/meta-quest/immersive-web-sdk)
[![WebXR Hand Tracking](https://img.shields.io/badge/WebXR-Bare%20Hand%20Tracking-06b6d4)](https://immersive-web.github.io/webxr-hand-input/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## Competition Positioning

- **Track:** Productivity
- **Division:** New Experience
- **Special Award Target:** Best Agentic Interaction
- **Target Platform:** Meta Quest Browser (WebXR, Immersive VR, 6DoF Bare Hand Tracking)
- **Primary SDK:** Meta Immersive Web SDK (`@iwsdk/core` v1.1.0), TypeScript, Three.js
- **Live Deployment:** [https://mindpalace-vr.vercel.app](https://mindpalace-vr.vercel.app)
- **Repository:** [https://github.com/anishagrawal25/mindpalace-vr](https://github.com/anishagrawal25/mindpalace-vr)

---

## Executive Summary

Human spatial cognition is far more powerful than vertical scrolling or 2D tab switching. For millennia, thinkers and orators relied on the **Method of Loci** (the Memory Palace)—anchoring abstract thoughts to physical locations that the mind can intuitively navigate.

**MindPalace VR** translates this cognitive framework into WebXR. Rather than viewing notes on flat 2D dashboards, users step into a seated-first, ergonomic 3D cosmos where ideas, notes, and topics are tangible physical objects they can grab, manipulate, and connect with their bare hands.

To elevate spatial organization into an active learning partner, MindPalace VR integrates the **Palace Agent**—an autonomous spatial AI that synthesizes comprehensive concept trees, discovers missing conceptual links, flags unmapped knowledge gaps, and administers interactive in-VR quizzes.

---

## Key Features & Innovations

### 1. Hands-First Spatial Manipulation (Meta IWSDK)
- **Natural Pinch & Grab:** Built directly on Meta's Immersive Web SDK (`@iwsdk/core`) utilizing `OneHandGrabbable` and `features.grabbing.useHandPinchForGrab`. Users interact with natural thumb-and-index finger pinches—no controllers required.
- **Seated-First Ergonomics:** Designed for extended study without arm fatigue. Every interactive entity is clamped within an ergonomic comfort envelope of **0.3m to 0.85m** at chest level.
- **Synthesized Haptics & Audio:** Zero-dependency procedural Web Audio synthesis generates immediate sonic confirmation for hovering, grabbing, dropping, and connecting.

### 2. 3D Spatial Knowledge Primitives
- **Idea Spheres:** Radiant procedural geometries (`MeshStandardMaterial`) with luminous outer auras and high-contrast billboard labels.
- **Frosted Glass Note Cards:** Translucent 3D cards displaying multi-line text, definitions, code snippets, and zone badges rendered dynamically on high-DPI canvas textures.
- **Core Topic Nodes:** Faceted icosahedrons with orbiting kinetic rings that serve as thematic anchors.
- **Visual State Transitions:** Smooth real-time transitions across `idle`, `hovered`, `selected`, and `grabbed` states.

### 3. Dynamic Spatial Connections
- **Live Vertex Tracking:** Luminous spatial lines link related concepts. Line endpoints recalculate each frame as nodes are grabbed and moved in 3D space.
- **Midpoint Severing:** Every connection features an interactive midpoint bead; pinching the bead severs the link with immediate audio feedback.

### 4. Autonomous Palace Agent (Best Agentic Interaction)
- **Concept Tree Synthesis:** Enter any domain (e.g., *Data Structures*, *AI/ML*, *Distributed Systems*). The agent spawns 5–8 conceptual idea spheres into the target zone in an organized radial layout.
- **Pedagogical Link Suggestion:** The agent analyzes isolated ideas and proposes logical connections with explanatory rationales (e.g., *Linking Multi-Head Attention to FlashAttention for memory-bandwidth optimization*).
- **Knowledge Gap Auditing:** Scans the palace for unlinked concept islands or missing foundational principles.
- **Spatial Walkthrough Quiz:** Generates interactive multi-choice review questions to test active recall in VR.

### 5. Dual-Redundant Persistence
- State (nodes, coordinates, connections, and assigned zones) auto-saves continuously to **IndexedDB** with an automatic **LocalStorage fallback**.
- Refreshes or browser restarts instantly restore the exact spatial layout.

### 6. Curated Subject Zones
- Four designated radial zones on the horizontal spatial plane:
  - **Algorithms & Data Structures** (Cyan `#06b6d4`)
  - **AI & Machine Learning** (Purple `#a855f7`)
  - **Databases & Storage** (Emerald `#10b981`)
  - **Java & Systems Architecture** (Amber `#f59e0b`)
- Dragging an object into a zone automatically updates its ownership tag.

---

## Step-by-Step Instructions for Competition Judges

### Path A: Evaluation on Meta Quest Hardware (Recommended)

> [!IMPORTANT]
> For the optimal hands-first experience, evaluate directly inside the native **Meta Quest Browser** on Quest 2, Quest 3, Quest 3S, or Quest Pro.

1. **Launch:** Put on your Meta Quest headset and open the **Meta Quest Browser**.
2. **Navigate:** Go to the public URL:
   ```text
   https://mindpalace-vr.vercel.app
   ```
3. **Enter VR:** Tap the central purple **`ENTER IMMERSIVE VR`** button.
4. **Switch to Hands:** Put down your Touch controllers. Bare hand tracking engages automatically.
5. **Recommended Evaluation Flow:**
   - **Step 1 — Load Rich Demo:** Tap **`★ Load Demo Palace`** on the central control bar to instantly inflate a populated 12-node, 9-connection showcase across all 4 subject zones.
   - **Step 2 — Hand Manipulation:** Pinch any glowing Idea Sphere or Glass Note with your index finger and thumb. Move it around in 3D space and release it into another subject zone.
   - **Step 3 — Severing Connections:** Look at any glowing connection line and pinch the small midpoint bead to cut the link.
   - **Step 4 — Spatial Creation:** Pinch any button on the floating in-VR creation palette (**`+ Idea`**, **`+ Note`**, **`+ Topic`**) to spawn an object right in front of you.
   - **Step 5 — Test Palace Agent:** Open the floating Agent panel, select **`AI / ML`** or **`Databases`**, and watch the agent spawn concept clusters, suggest connections, flag knowledge gaps, and present an active recall quiz.
   - **Step 6 — Persistence Check:** Exit VR and reload the browser page. Click **`ENTER IMMERSIVE VR`** again to verify that your custom object positions and connections were fully restored from IndexedDB.

---

### Path B: Evaluation on Desktop / Laptop (Development Preview)

If hardware is not immediately available, judges can evaluate all logic, layout, and agent capabilities in any modern browser:

1. Open `https://mindpalace-vr.vercel.app` in Chrome, Edge, or Firefox.
2. Note the persistent badge: **`Development Preview, not VR`** (in accordance with competition integrity guidelines).
3. Use your mouse to click and drag objects in 3D space.
4. Click **`★ Load Demo Palace`** to test scene inflation, or use the bottom-left Creator dock to spawn custom nodes.
5. Trigger the Palace Agent panel on the left to verify LLM concept generation, gap audits, and interactive quizzes.

---

## Technical Architecture & Engineering Integrity

```
┌──────────────────────────────────────────────────────────────┐
│                      Meta Quest Browser                      │
│                  WebXR Immersive-VR Session                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │   Meta Immersive Web SDK    │
                │        (@iwsdk/core)        │
                ├─────────────────────────────┤
                │ • InputSystem & XR Origin   │
                │ • OneHandGrabbable (6DoF)   │
                │ • RayInteractable & Tags    │
                └──────────────┬──────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌─────────────────┐
│ Palace Scene │       │ Connections  │       │   Persistence   │
│   Manager    │       │   Manager    │       │     Manager     │
├──────────────┤       ├──────────────┤       ├─────────────────┤
│ • Spheres    │       │ • Dynamic    │       │ • IndexedDB     │
│ • Cards      │       │   BufferGeo  │       │ • LocalStorage  │
│ • Topics     │       │ • Cut Beads  │       │ • Auto-Restore  │
└──────┬───────┘       └──────┬───────┘       └─────────────────┘
       │                      │
       └──────────────┬───────┘
                      │
       ┌──────────────▼──────────────┐
       │     Palace Agent Client     │
       └──────────────┬──────────────┘
                      │ POST /api/agent
       ┌──────────────▼──────────────┐
       │   Vercel Serverless Edge    │
       │  (Zero API Key Exposure)    │
       ├─────────────────────────────┤
       │ • Structured JSON Parsing   │
       │ • Deterministic Fallback    │
       └─────────────────────────────┘
```

### Engineering Standards & Integrity Commitments
- **Zero Hack Pinch Detection:** All grab and manipulation behaviors leverage IWSDK's native grab subsystem and WebXR hand joint tracking (`features.grabbing.useHandPinchForGrab`). No custom brittle distance hacks are used.
- **Honest Attribution:** Desktop input is clearly demarcated as a development preview; mouse clicks are never labeled as real hand tracking.
- **Secure Serverless Architecture:** All AI agent interactions are routed through `/api/agent`. API keys are never exposed in client bundles.
- **100% Demo Reliability:** Built-in deterministic fallbacks guarantee that judge evaluations, live demonstrations, and network outages never disrupt the experience.
- **Performance Budget:** Light procedural Three.js geometry, unbatched texture avoidance, and capped lighting maintain stable 72/90 FPS on Snapdragon XR2 mobile chipsets.

---

## Quick Reference & Repository Links

- **Main Entry Point:** [src/main.ts](file:///Users/dhruvpatil/mindpalace-vr/src/main.ts)
- **IWSDK Verification Report:** [docs/VERIFIED.md](file:///Users/dhruvpatil/mindpalace-vr/docs/VERIFIED.md)
- **Feature Status & Hardware Risks:** [STATUS.md](file:///Users/dhruvpatil/mindpalace-vr/STATUS.md)
- **Serverless Endpoint:** [api/agent.ts](file:///Users/dhruvpatil/mindpalace-vr/api/agent.ts)
- **Client Agent Service:** [src/agent/agent-client.ts](file:///Users/dhruvpatil/mindpalace-vr/src/agent/agent-client.ts)
- **Hand Interaction Subsystem:** [src/interaction/hand-interaction-manager.ts](file:///Users/dhruvpatil/mindpalace-vr/src/interaction/hand-interaction-manager.ts)
- **Spatial Connection Engine:** [src/interaction/connection-manager.ts](file:///Users/dhruvpatil/mindpalace-vr/src/interaction/connection-manager.ts)
