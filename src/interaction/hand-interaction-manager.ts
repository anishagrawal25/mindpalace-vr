import {
  World,
  Entity,
  Hovered,
  Pressed,
  Grabbed,
  Vector3,
} from '@iwsdk/core';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { KnowledgeObjectContainer } from '../objects/knowledge-mesh-factory';
import { spatialAudio } from '../scene/spatial-audio';

export interface HandStatus {
  leftDetected: boolean;
  leftIsHand: boolean;
  rightDetected: boolean;
  rightIsHand: boolean;
  activePinchLeft: boolean;
  activePinchRight: boolean;
}

export type HandStatusListener = (status: HandStatus) => void;

/**
 * HandInteractionManager leverages IWSDK's built-in input and grab systems:
 * - Listens for WebXR hand tracking input sources
 * - Connects ECS transient state tags (Hovered, Pressed, Grabbed) to spatial objects
 * - Provides hover feedback and grab-move-release lifecycle events
 * - Constrains moved objects to the seated-first 0.3m–0.8m ergonomic envelope
 */
export class HandInteractionManager {
  private world: World;
  private palaceManager: PalaceSceneManager;
  private currentStatus: HandStatus = {
    leftDetected: false,
    leftIsHand: false,
    rightDetected: false,
    rightIsHand: false,
    activePinchLeft: false,
    activePinchRight: false,
  };
  private listeners: Set<HandStatusListener> = new Set();
  private selectedNode: KnowledgeObjectContainer | null = null;
  private currentlyGrabbedNode: KnowledgeObjectContainer | null = null;
  private lastHoveredNodeId: string | null = null;

  // Callbacks for connections and zone placement
  public onNodeGrabbed?: (node: KnowledgeObjectContainer) => void;
  public onNodeMoved?: (node: KnowledgeObjectContainer) => void;
  public onNodeReleased?: (node: KnowledgeObjectContainer) => void;
  public onNodeSelected?: (node: KnowledgeObjectContainer) => void;

  constructor(world: World, palaceManager: PalaceSceneManager) {
    this.world = world;
    this.palaceManager = palaceManager;
    this.initLoop();
  }

  public subscribe(listener: HandStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => this.listeners.delete(listener);
  }

  public getSelectedNode(): KnowledgeObjectContainer | null {
    return this.selectedNode;
  }

  public setSelectedNode(node: KnowledgeObjectContainer | null) {
    if (this.selectedNode && this.selectedNode !== node) {
      if (this.selectedNode.visualState === 'selected') {
        this.selectedNode.setVisualState('idle');
      }
    }
    this.selectedNode = node;
    if (node) {
      node.setVisualState('selected');
      spatialAudio.playHover();
      this.onNodeSelected?.(node);
    }
  }

  private initLoop() {
    this.world.onXRFrame(() => {
      this.updateHandTrackingStatus();
      this.updateGrabAndHoverStates();
    });
  }

  /**
   * Inspects active WebXR session input sources to detect real hands vs controllers.
   */
  private updateHandTrackingStatus() {
    const session = this.world.session;
    let leftDetected = false;
    let leftIsHand = false;
    let rightDetected = false;
    let rightIsHand = false;

    if (session && session.inputSources) {
      for (const source of session.inputSources) {
        const isHand = !!source.hand;
        if (source.handedness === 'left') {
          leftDetected = true;
          leftIsHand = isHand;
        } else if (source.handedness === 'right') {
          rightDetected = true;
          rightIsHand = isHand;
        }
      }
    }

    const changed =
      this.currentStatus.leftDetected !== leftDetected ||
      this.currentStatus.leftIsHand !== leftIsHand ||
      this.currentStatus.rightDetected !== rightDetected ||
      this.currentStatus.rightIsHand !== rightIsHand;

    if (changed) {
      this.currentStatus.leftDetected = leftDetected;
      this.currentStatus.leftIsHand = leftIsHand;
      this.currentStatus.rightDetected = rightDetected;
      this.currentStatus.rightIsHand = rightIsHand;

      this.listeners.forEach((listener) => listener(this.currentStatus));
    }
  }

  /**
   * Detects IWSDK ECS grab state transitions (Grabbed tag) and updates positions.
   */
  private updateGrabAndHoverStates() {
    const nodes = this.palaceManager.getAllNodes();
    let activeGrab: KnowledgeObjectContainer | null = null;
    let currentHoverId: string | null = null;

    for (const node of nodes) {
      const isGrabbed = node.visualState === 'grabbed';
      const isHovered = node.visualState === 'hovered';

      if (isHovered) {
        currentHoverId = node.nodeData.id;
      }

      if (isGrabbed) {
        activeGrab = node;

        // Enforce seated comfort radius & notify listeners of live movement
        this.clampToSeatedComfortRadius(node);
        this.onNodeMoved?.(node);
      }
    }

    // Play hover audio once per hover enter
    if (currentHoverId && currentHoverId !== this.lastHoveredNodeId && !activeGrab) {
      spatialAudio.playHover();
      this.lastHoveredNodeId = currentHoverId;
    } else if (!currentHoverId) {
      this.lastHoveredNodeId = null;
    }

    // Detect grab start
    if (activeGrab && !this.currentlyGrabbedNode) {
      this.currentlyGrabbedNode = activeGrab;
      spatialAudio.playGrab();
      this.onNodeGrabbed?.(activeGrab);
    }

    // Detect release
    if (!activeGrab && this.currentlyGrabbedNode) {
      const released = this.currentlyGrabbedNode;
      this.currentlyGrabbedNode = null;

      // Update node data position
      released.nodeData.position = [
        released.position.x,
        released.position.y,
        released.position.z,
      ];

      spatialAudio.playRelease();
      this.onNodeReleased?.(released);
    }
  }

  /**
   * Enforces seated ergonomics (0.28m to 0.85m radius from origin [0, 1.2, 0])
   * so objects can never be accidentally flung out of physical reach.
   */
  private clampToSeatedComfortRadius(node: KnowledgeObjectContainer) {
    const originY = 1.2;
    const dx = node.position.x;
    const dy = node.position.y - originY;
    const dz = node.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const minRadius = 0.28;
    const maxRadius = 0.85;

    if (dist > maxRadius) {
      const scale = maxRadius / dist;
      node.position.x = dx * scale;
      node.position.y = originY + dy * scale;
      node.position.z = dz * scale;
    } else if (dist < minRadius && dist > 0.001) {
      const scale = minRadius / dist;
      node.position.x = dx * scale;
      node.position.y = originY + dy * scale;
      node.position.z = dz * scale;
    }
  }
}
