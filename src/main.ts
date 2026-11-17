import { World, SessionMode } from '@iwsdk/core';
import { setupEnvironment } from './scene/environment';
import { XRSessionManager } from './ui/xr-session-manager';
import { PalaceSceneManager } from './objects/palace-scene-manager';

async function bootstrap() {
  const container = document.getElementById('scene-container');
  if (!container) {
    console.error('Scene container #scene-container not found');
    return;
  }

  // Initialize IWSDK World with native hand tracking and pinch-grab support
  const world = await World.create(container, {
    xr: {
      sessionMode: SessionMode.ImmersiveVR,
      features: {
        handTracking: true,
      },
    },
    features: {
      grabbing: {
        useHandPinchForGrab: true,
      },
    },
    render: {
      camera: {
        position: [0, 1.2, 0], // Ergonomic seated eye level
      },
    },
  });

  // Setup deep navy base with purple & cyan ambient/accent lighting
  const env = setupEnvironment(world);

  // Initialize XR session entry & unsupported device handling
  new XRSessionManager(world);

  // Initialize Palace Scene Manager
  const palaceManager = new PalaceSceneManager(world);

  // Seed initial representative knowledge objects (within 0.3m - 0.8m seated comfort zone)
  palaceManager.addNode({
    id: 'topic-dsa',
    type: 'topic',
    title: 'Data Structures & Algorithms',
    position: [0, 1.25, -0.55],
    color: '#a855f7',
    createdAt: Date.now(),
  });

  palaceManager.addNode({
    id: 'idea-binary-search',
    type: 'idea',
    title: 'Binary Search O(log n)',
    position: [-0.28, 1.15, -0.50],
    color: '#06b6d4',
    createdAt: Date.now(),
  });

  palaceManager.addNode({
    id: 'note-complexity',
    type: 'note',
    title: 'Divide & Conquer',
    content: 'Halve the search space at each iteration. Sorted invariant required.',
    position: [0.28, 1.18, -0.48],
    zoneId: 'DSA',
    createdAt: Date.now(),
  });

  // Subtle slow rotation of spatial dust
  world.onXRFrame((_frame, delta) => {
    env.spatialDust.rotation.y += delta * 0.02;
  });

  console.log('MindPalace VR initialized successfully with initial knowledge objects');
}

bootstrap().catch((err) => {
  console.error('Failed to initialize MindPalace VR:', err);
});
