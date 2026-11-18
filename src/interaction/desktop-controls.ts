import {
  World,
  Vector3,
  Raycaster,
  Vector2,
} from '@iwsdk/core';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';

/**
 * Provides smooth mouse drag-to-look and raycast interaction for 2D desktop
 * development preview. Disabled automatically when entering an immersive WebXR session.
 */
export class DesktopControls {
  private world: World;
  private palaceManager: PalaceSceneManager;
  private isDragging = false;
  private previousMouseX = 0;
  private previousMouseY = 0;
  private yaw = 0;
  private pitch = 0;
  private raycaster = new Raycaster();
  private mouseVec = new Vector2();

  constructor(world: World, palaceManager: PalaceSceneManager) {
    this.world = world;
    this.palaceManager = palaceManager;
    this.init();
  }

  private init() {
    const canvas = this.world.renderer.domElement;
    if (!canvas) return;

    // Mouse drag to look around
    canvas.addEventListener('mousedown', (e) => {
      if (this.world.session) return;
      if (e.button === 0) {
        this.isDragging = true;
        this.previousMouseX = e.clientX;
        this.previousMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.world.session || !this.isDragging) return;

      const deltaX = e.clientX - this.previousMouseX;
      const deltaY = e.clientY - this.previousMouseY;
      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;

      // Sensitivity
      this.yaw -= deltaX * 0.003;
      this.pitch -= deltaY * 0.003;

      // Clamp pitch to avoid gimbal lock (-80 deg to +80 deg)
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

      this.world.camera.rotation.order = 'YXZ';
      this.world.camera.rotation.y = this.yaw;
      this.world.camera.rotation.x = this.pitch;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch drag for mobile browsers / preview
    canvas.addEventListener('touchstart', (e) => {
      if (this.world.session || e.touches.length !== 1) return;
      this.isDragging = true;
      this.previousMouseX = e.touches[0].clientX;
      this.previousMouseY = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (this.world.session || !this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMouseX;
      const deltaY = e.touches[0].clientY - this.previousMouseY;
      this.previousMouseX = e.touches[0].clientX;
      this.previousMouseY = e.touches[0].clientY;

      this.yaw -= deltaX * 0.004;
      this.pitch -= deltaY * 0.004;
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

      this.world.camera.rotation.order = 'YXZ';
      this.world.camera.rotation.y = this.yaw;
      this.world.camera.rotation.x = this.pitch;
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Mouse click on desktop to select/hover nodes
    canvas.addEventListener('click', (e) => {
      if (this.world.session) return;
      const rect = canvas.getBoundingClientRect();
      this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseVec, this.world.camera);
      const meshes: any[] = [];
      for (const node of this.palaceManager.getAllNodes()) {
        node.traverse((child) => {
          if ((child as any).isMesh) {
            meshes.push(child);
          }
        });
      }

      const intersects = this.raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        let parent: any = intersects[0].object;
        while (parent && !parent.nodeData && parent.parent) {
          parent = parent.parent;
        }
        if (parent && parent.nodeData) {
          parent.setVisualState(parent.visualState === 'selected' ? 'idle' : 'selected');
        }
      }
    });
  }

  public resetOrientation() {
    this.yaw = 0;
    this.pitch = 0;
    this.world.camera.rotation.set(0, 0, 0);
  }
}
