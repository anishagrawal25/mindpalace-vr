import {
  World,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
  RayInteractable,
  OneHandGrabbable,
  Vector3,
  CanvasTexture,
  SRGBColorSpace,
} from '@iwsdk/core';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { KnowledgeType } from '../types/knowledge';
import { spatialAudio } from '../scene/spatial-audio';
import { roundRect } from '../objects/text-texture-generator';

export class SpatialPalette {
  private world: World;
  private palaceManager: PalaceSceneManager;
  private paletteGroup: Group;
  private desktopPaletteEl: HTMLElement | null = null;
  private spawnCounter = 1;

  constructor(world: World, palaceManager: PalaceSceneManager) {
    this.world = world;
    this.palaceManager = palaceManager;
    this.paletteGroup = new Group();
    this.paletteGroup.name = 'spatial_creation_palette';

    this.buildInVRPalette();
    this.buildDesktopPaletteFallback();
  }

  /**
   * Builds an in-VR 3D spatial palette docked right at seated chest level (y=0.92, z=-0.48),
   * angled up toward the user's eyes for effortless pinch/tap interaction.
   */
  private buildInVRPalette() {
    this.paletteGroup.position.set(0, 0.92, -0.48);
    this.paletteGroup.rotation.x = -Math.PI / 6; // 30 degrees tilt towards eyes

    // Backing panel
    const panelGeo = new PlaneGeometry(0.36, 0.12);
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 6;
    roundRect(ctx, 8, 8, 704, 224, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CREATION PALETTE (PINCH TO SPAWN)', 360, 48);

    // Draw 3 button zones on texture
    // Button 1: Idea
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    roundRect(ctx, 32, 76, 200, 128, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px -apple-system, sans-serif';
    ctx.fillText('+ IDEA', 132, 148);

    // Button 2: Note
    ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.strokeStyle = '#c084fc';
    roundRect(ctx, 260, 76, 200, 128, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('+ NOTE', 360, 148);

    // Button 3: Topic
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.strokeStyle = '#a855f7';
    roundRect(ctx, 488, 76, 200, 128, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('+ TOPIC', 588, 148);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const panelMat = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
    });
    const panelMesh = new Mesh(panelGeo, panelMat);
    this.paletteGroup.add(panelMesh);

    // Add three invisible 3D hit targets for IWSDK RayInteractable / Poke
    const createHitTarget = (
      xOffset: number,
      type: KnowledgeType,
      defaultTitle: string
    ) => {
      const hitGeo = new PlaneGeometry(0.1, 0.07);
      const hitMat = new MeshBasicMaterial({
        visible: false,
      });
      const hitMesh = new Mesh(hitGeo, hitMat);
      hitMesh.position.set(xOffset, -0.01, 0.005);
      this.paletteGroup.add(hitMesh);

      const entity = this.world.createTransformEntity(hitMesh);
      entity.addComponent(RayInteractable);

      // On select/pinch click
      hitMesh.addEventListener('click' as any, () => {
        this.spawnKnowledgeObject(type, defaultTitle);
      });
    };

    createHitTarget(-0.114, 'idea', 'Key Insight');
    createHitTarget(0, 'note', 'Concept Note');
    createHitTarget(0.114, 'topic', 'New Core Topic');

    this.world.scene.add(this.paletteGroup);
  }

  /**
   * 2D overlay creation dock for development preview and fallback.
   */
  private buildDesktopPaletteFallback() {
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) return;

    this.desktopPaletteEl = document.createElement('div');
    this.desktopPaletteEl.className = 'interactive';
    this.desktopPaletteEl.style.cssText = `
      position: absolute;
      bottom: 76px;
      left: 24px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      max-width: 320px;
      z-index: 20;
    `;

    this.desktopPaletteEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Palace Object Creator</span>
        <span style="font-size: 10px; color: #64748b;">(VR & Fallback)</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="btn-add-idea" style="flex: 1; padding: 6px 10px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid #06b6d4; background: rgba(6, 182, 212, 0.15); color: #38bdf8; cursor: pointer;">+ Idea</button>
        <button id="btn-add-note" style="flex: 1; padding: 6px 10px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid #c084fc; background: rgba(192, 132, 252, 0.15); color: #c084fc; cursor: pointer;">+ Note</button>
        <button id="btn-add-topic" style="flex: 1; padding: 6px 10px; font-size: 12px; font-weight: 600; border-radius: 8px; border: 1px solid #a855f7; background: rgba(168, 85, 247, 0.15); color: #d8b4fe; cursor: pointer;">+ Topic</button>
      </div>
      <div style="display: flex; gap: 6px;">
        <input id="custom-title-input" type="text" placeholder="Custom label..." style="flex: 1; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 6px; padding: 5px 8px; color: #f8fafc; font-size: 12px; outline: none;" />
        <button id="btn-add-custom" style="padding: 5px 10px; background: #0284c7; border: none; border-radius: 6px; color: white; font-size: 12px; font-weight: 600; cursor: pointer;">Add</button>
      </div>
    `;

    overlay.appendChild(this.desktopPaletteEl);

    const ideaBtn = this.desktopPaletteEl.querySelector('#btn-add-idea');
    const noteBtn = this.desktopPaletteEl.querySelector('#btn-add-note');
    const topicBtn = this.desktopPaletteEl.querySelector('#btn-add-topic');
    const customBtn = this.desktopPaletteEl.querySelector('#btn-add-custom');
    const input = this.desktopPaletteEl.querySelector('#custom-title-input') as HTMLInputElement;

    if (ideaBtn) {
      ideaBtn.addEventListener('click', () => {
        this.spawnKnowledgeObject('idea', input.value.trim() || 'Dynamic Programming');
        input.value = '';
      });
    }
    if (noteBtn) {
      noteBtn.addEventListener('click', () => {
        this.spawnKnowledgeObject('note', input.value.trim() || 'Memoization Table');
        input.value = '';
      });
    }
    if (topicBtn) {
      topicBtn.addEventListener('click', () => {
        this.spawnKnowledgeObject('topic', input.value.trim() || 'Advanced Algorithms');
        input.value = '';
      });
    }
    if (customBtn) {
      customBtn.addEventListener('click', () => {
        const text = input.value.trim() || 'Concept Note';
        this.spawnKnowledgeObject('idea', text);
        input.value = '';
      });
    }
  }

  public spawnKnowledgeObject(type: KnowledgeType, title: string) {
    const id = `node_${Date.now()}_${this.spawnCounter++}`;

    // Spawn at reachable sweet spot in front of user (0.42m - 0.52m distance)
    const jitterX = (Math.random() - 0.5) * 0.25;
    const jitterY = (Math.random() - 0.5) * 0.15;
    const spawnPos: [number, number, number] = [
      jitterX,
      1.15 + jitterY,
      -0.45,
    ];

    const colors: Record<KnowledgeType, string> = {
      idea: '#06b6d4',
      note: '#c084fc',
      topic: '#a855f7',
    };

    const node = this.palaceManager.addNode({
      id,
      type,
      title: `${title} #${this.spawnCounter}`,
      content: type === 'note' ? 'Tap and drag to position in your memory palace.' : undefined,
      position: spawnPos,
      color: colors[type],
      createdAt: Date.now(),
    });

    spatialAudio.playGrab();
    return node;
  }
}
