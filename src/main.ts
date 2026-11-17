import { World, SessionMode } from '@iwsdk/core';
import { setupEnvironment } from './scene/environment';

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

  // Subtle slow rotation of spatial dust
  world.onXRFrame((_frame, delta) => {
    env.spatialDust.rotation.y += delta * 0.02;
  });

  console.log('MindPalace VR environment initialized successfully');
}

bootstrap().catch((err) => {
  console.error('Failed to initialize MindPalace VR:', err);
});
