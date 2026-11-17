# MindPalace VR - Implementation & Verification Status

| Feature | Built | Tested in Simulator | Unverified on Hardware | Notes & Hardware Risk Factors |
| :--- | :---: | :---: | :---: | :--- |
| **P0: Base Immersive WebXR Scene** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Need to test stereo rendering & 72/90/120Hz performance on Quest |
| **P0: Seated-First Ergonomic Zone (0.3m–0.8m)** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Arm reach comfort & neck strain over extended use |
| **P0: Knowledge Objects (Spheres, Cards, Nodes)** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Visual readability of 3D text cards inside Quest lenses |
| **P0: IWSDK Hand Input & Hover/Select Feedback** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Real hand joint latency & tracking loss when hands overlap |
| **P0: Direct OneHandGrabbable 6DoF Manipulation** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Pinch threshold sensitivity vs accidental drops |
| **P0: Spatial Connections & Live Drag Preview** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Line rendering thickness & depth perception in VR |
| **P0: Connection Removal & Dynamic Updates** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Line shader performance with dozens of links |
| **P0: Persistence (IndexedDB/localStorage)** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Browser storage quotas inside Quest Browser |
| **P0: Spatial Creation Palette (In-VR / Fallback)** | ⏳ In Progress | ⏳ In Progress | ⚠️ Unverified | Virtual keyboard comfort vs quick preset selection |
| **P1: Palace Agent Serverless Endpoint (`/api/agent`)**| ⏳ Planned | ⏳ Planned | ⚠️ Unverified | Latency of streaming/structured JSON response |
| **P1: Agent Knowledge Tree Generation & Gap Flagging** | ⏳ Planned | ⏳ Planned | ⚠️ Unverified | Object spawning collision avoidance in 3D |
| **P1: Subject Zones (DSA, Java, DB, AI/ML)** | ⏳ Planned | ⏳ Planned | ⚠️ Unverified | Boundary detection & visual clutter |
| **P1: Onboarding Tutorial & Hand Hints** | ⏳ Planned | ⏳ Planned | ⚠️ Unverified | Readability and positioning relative to player head |
| **P1: Pre-seeded Demo Palace** | ⏳ Planned | ⏳ Planned | ⚠️ Unverified | Initial frame drop during scene inflation |
| **P1: Return-to-Center & Space Reset** | ⏳ Planned | ⏳ Planned | ⚠️ Unverified | Recenter orientation alignment with Quest guardian |

### Known Risks for Real Meta Quest Hardware
1. **Hand Joint Tracking Latency & Occlusion:** WebXR hand tracking loses tracking when hands cross or are oriented edge-on to headset cameras. Fallback to ray pointers or graceful release is necessary.
2. **Text Readability in VR:** Small typography on 3D floating glass cards can blur due to VR display subpixel arrangements and chromatic aberration. Cards must maintain high contrast with sharp canvas-rendered textures.
3. **Ergonomic Distance:** Objects placed further than 0.8m force physical reaching or standing. Seated-first radius (0.35m–0.65m) is essential for fatigue-free operation.
4. **Lighting & Shader Overhead:** Uncapped dynamic point lights or expensive PBR materials degrade framerate below 72 FPS on mobile XR chipsets (Snapdragon XR2 Gen 2). Simple PBR or unlit/emissive accents are prioritized.
