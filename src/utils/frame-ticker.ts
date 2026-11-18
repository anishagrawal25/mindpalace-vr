import type { World } from '@iwsdk/core';

/**
 * Registers a tick callback that executes seamlessly both inside an active
 * WebXR immersive session (via world.onXRFrame) and in 2D desktop preview
 * mode (via requestAnimationFrame).
 */
export function registerFrameTick(
  world: World,
  callback: (delta: number, elapsedTime: number) => void
) {
  let lastTime = performance.now();
  let totalElapsed = 0;

  // 1. In XR session, tick via native XRFrame loop
  world.onXRFrame((_frame, delta, time) => {
    callback(delta, time);
  });

  // 2. On desktop (non-XR preview), tick via requestAnimationFrame
  const loop = (currentTime: number) => {
    if (!world.session) {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      totalElapsed += delta;
      callback(delta, totalElapsed);
    } else {
      lastTime = currentTime;
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}
