import {
  World,
  Entity,
  RayInteractable,
  OneHandGrabbable,
  Hovered,
  Grabbed,
  Vector3,
} from '@iwsdk/core';
import type { KnowledgeNodeData, VisualState } from '../types/knowledge';
import {
  createKnowledgeObject,
  type KnowledgeObjectContainer,
} from './knowledge-mesh-factory';
import { registerFrameTick } from '../utils/frame-ticker';

export class PalaceSceneManager {
  private world: World;
  private nodes: Map<string, { container: KnowledgeObjectContainer; entity: Entity }> = new Map();
  private tempVec = new Vector3();

  constructor(world: World) {
    this.world = world;
    this.initECSStateTracking();
  }

  /**
   * Spawns a knowledge object into the 3D space, registering it with
   * IWSDK's native RayInteractable and OneHandGrabbable components.
   */
  public addNode(data: KnowledgeNodeData): KnowledgeObjectContainer {
    if (this.nodes.has(data.id)) {
      this.removeNode(data.id);
    }

    // 1. Create procedural 3D object
    const container = createKnowledgeObject(data);
    this.world.scene.add(container);

    // 2. Register as IWSDK Transform Entity with direct hand grab & ray pointer components
    const entity = this.world.createTransformEntity(container);
    entity.addComponent(RayInteractable);
    entity.addComponent(OneHandGrabbable, {
      translate: true,
      rotate: true,
    });

    this.nodes.set(data.id, { container, entity });
    return container;
  }

  public removeNode(id: string) {
    const entry = this.nodes.get(id);
    if (!entry) return;

    this.world.scene.remove(entry.container);
    // Destroy entity in ECS
    entry.entity.destroy();
    this.nodes.delete(id);
  }

  public getNode(id: string): KnowledgeObjectContainer | undefined {
    return this.nodes.get(id)?.container;
  }

  public getAllNodes(): KnowledgeObjectContainer[] {
    return Array.from(this.nodes.values()).map((v) => v.container);
  }

  public getAllNodeData(): KnowledgeNodeData[] {
    return Array.from(this.nodes.values()).map((v) => {
      // Sync latest 3D position
      const pos = v.container.position;
      return {
        ...v.container.nodeData,
        position: [pos.x, pos.y, pos.z],
      };
    });
  }

  /**
   * Tracks IWSDK's transient component tags (Hovered, Grabbed) to smoothly
   * update visual states (idle, hovered, grabbed) across both real Quest hand tracking
   * and desktop emulation.
   */
  private initECSStateTracking() {
    registerFrameTick(this.world, (delta) => {
      const cameraPos = this.world.camera.position;

      for (const [_id, { container, entity }] of this.nodes) {
        // 1. Run node animation tick (orbital ring, pulses)
        if (container.updateTick) {
          container.updateTick(delta);
        }

        // 2. Keep floating text labels oriented toward player camera
        container.children.forEach((child) => {
          if (child.name !== 'comfortZoneRings') {
            // For planes or labels inside container, orient to camera
            this.tempVec.set(cameraPos.x, child.position.y + container.position.y, cameraPos.z);
            child.lookAt(this.tempVec);
          }
        });

        // 3. Inspect IWSDK transient state tags
        const isGrabbed = entity.hasComponent(Grabbed);
        const isHovered = entity.hasComponent(Hovered);

        if (isGrabbed) {
          if (container.visualState !== 'grabbed') {
            container.setVisualState('grabbed');
          }
        } else if (isHovered) {
          if (container.visualState !== 'hovered' && container.visualState !== 'selected') {
            container.setVisualState('hovered');
          }
        } else {
          if (container.visualState !== 'idle' && container.visualState !== 'selected') {
            container.setVisualState('idle');
          }
        }
      }
    });
  }
}
