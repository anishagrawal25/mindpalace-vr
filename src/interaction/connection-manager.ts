import {
  World,
  Group,
  Line,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  Vector3,
  Color,
  RayInteractable,
} from '@iwsdk/core';
import type { ConnectionData } from '../types/knowledge';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { KnowledgeObjectContainer } from '../objects/knowledge-mesh-factory';
import { spatialAudio } from '../scene/spatial-audio';
import { registerFrameTick } from '../utils/frame-ticker';

interface RenderedConnection {
  data: ConnectionData;
  line: Line;
  midpointBead: Mesh;
  sourceNode: KnowledgeObjectContainer;
  targetNode: KnowledgeObjectContainer;
}

export class ConnectionManager {
  private world: World;
  private palaceManager: PalaceSceneManager;
  private connections: Map<string, RenderedConnection> = new Map();
  private connectionGroup: Group;

  // Live drag preview state
  private isConnecting: boolean = false;
  private previewSource: KnowledgeObjectContainer | null = null;
  private previewLine: Line | null = null;
  private previewGeo: BufferGeometry | null = null;
  private previewPosArray: Float32Array = new Float32Array(6);

  private tempMidpoint = new Vector3();

  constructor(world: World, palaceManager: PalaceSceneManager) {
    this.world = world;
    this.palaceManager = palaceManager;

    this.connectionGroup = new Group();
    this.connectionGroup.name = 'palace_connections';
    this.world.scene.add(this.connectionGroup);

    this.setupPreviewLine();
    this.initLiveUpdateLoop();
    this.buildConnectionsHUD();
  }

  private setupPreviewLine() {
    this.previewGeo = new BufferGeometry();
    this.previewGeo.setAttribute(
      'position',
      new Float32BufferAttribute(this.previewPosArray, 3)
    );

    const previewMat = new LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });

    this.previewLine = new Line(this.previewGeo, previewMat);
    this.previewLine.visible = false;
    this.world.scene.add(this.previewLine);
  }

  /**
   * Starts a live connection preview originating from sourceNode toward the pointer/hand.
   */
  public startConnectionPreview(sourceNode: KnowledgeObjectContainer) {
    this.isConnecting = true;
    this.previewSource = sourceNode;
    if (this.previewLine) {
      this.previewLine.visible = true;
    }
  }

  /**
   * Updates preview line end-point as the user's hand or pointer moves.
   */
  public updateConnectionPreview(targetPoint: Vector3) {
    if (!this.isConnecting || !this.previewSource || !this.previewGeo) return;

    const srcPos = this.previewSource.position;
    this.previewPosArray[0] = srcPos.x;
    this.previewPosArray[1] = srcPos.y;
    this.previewPosArray[2] = srcPos.z;

    this.previewPosArray[3] = targetPoint.x;
    this.previewPosArray[4] = targetPoint.y;
    this.previewPosArray[5] = targetPoint.z;

    this.previewGeo.attributes.position.needsUpdate = true;
  }

  /**
   * Cancels active drag preview.
   */
  public cancelConnectionPreview() {
    this.isConnecting = false;
    this.previewSource = null;
    if (this.previewLine) {
      this.previewLine.visible = false;
    }
  }

  /**
   * Completes connection between two nodes and adds an interactive midpoint disconnect bead.
   */
  public createConnection(
    sourceId: string,
    targetId: string,
    label?: string
  ): ConnectionData | null {
    if (sourceId === targetId) return null;

    const connectionId = `conn_${sourceId}_${targetId}`;
    if (this.connections.has(connectionId)) return null;

    const sourceNode = this.palaceManager.getNode(sourceId);
    const targetNode = this.palaceManager.getNode(targetId);

    if (!sourceNode || !targetNode) return null;

    // Line mesh
    const posArray = new Float32Array(6);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(posArray, 3));

    const mat = new LineBasicMaterial({
      color: new Color(0xa855f7).lerp(new Color(0x06b6d4), 0.5),
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });

    const line = new Line(geo, mat);
    line.name = connectionId;
    this.connectionGroup.add(line);

    // Interactive midpoint disconnect bead (Sphere radius 0.016m = 1.6cm)
    const beadGeo = new SphereGeometry(0.016, 16, 16);
    const beadMat = new MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const midpointBead = new Mesh(beadGeo, beadMat);
    midpointBead.name = `bead_${connectionId}`;
    this.connectionGroup.add(midpointBead);

    // Register bead with IWSDK ECS for pinch/click disconnection
    const beadEntity = this.world.createTransformEntity(midpointBead);
    beadEntity.addComponent(RayInteractable);

    // Add click/select listener to remove connection
    midpointBead.addEventListener('click' as any, () => {
      this.removeConnection(connectionId);
    });

    const data: ConnectionData = {
      id: connectionId,
      sourceId,
      targetId,
      label,
      createdAt: Date.now(),
    };

    const rendered: RenderedConnection = {
      data,
      line,
      midpointBead,
      sourceNode,
      targetNode,
    };

    this.connections.set(connectionId, rendered);
    this.updateSingleConnection(rendered);

    this.cancelConnectionPreview();
    spatialAudio.playConnect();
    this.refreshConnectionsHUD();

    return data;
  }

  /**
   * Removes an existing connection by ID with audio feedback and cleanup.
   */
  public removeConnection(connectionId: string): boolean {
    const conn = this.connections.get(connectionId);
    if (!conn) return false;

    this.connectionGroup.remove(conn.line);
    this.connectionGroup.remove(conn.midpointBead);

    conn.line.geometry.dispose();
    if (conn.line.material instanceof LineBasicMaterial) {
      conn.line.material.dispose();
    }
    conn.midpointBead.geometry.dispose();
    if (conn.midpointBead.material instanceof MeshStandardMaterial) {
      conn.midpointBead.material.dispose();
    }

    this.connections.delete(connectionId);
    spatialAudio.playRelease();
    this.refreshConnectionsHUD();
    return true;
  }

  /**
   * Cleans up any connections attached to a deleted node.
   */
  public removeConnectionsForNode(nodeId: string) {
    const toRemove: string[] = [];
    for (const [id, conn] of this.connections) {
      if (conn.data.sourceId === nodeId || conn.data.targetId === nodeId) {
        toRemove.push(id);
      }
    }
    toRemove.forEach((id) => this.removeConnection(id));
  }

  public getAllConnections(): ConnectionData[] {
    return Array.from(this.connections.values()).map((c) => c.data);
  }

  /**
   * Live update loop: ensures all spatial connection lines & midpoint beads stay
   * attached smoothly whenever either attached node is moved in 3D space!
   */
  private initLiveUpdateLoop() {
    registerFrameTick(this.world, () => {
      for (const conn of this.connections.values()) {
        this.updateSingleConnection(conn);
      }
    });
  }

  private updateSingleConnection(conn: RenderedConnection) {
    const geo = conn.line.geometry;
    const posAttr = geo.attributes.position as Float32BufferAttribute;
    const array = posAttr.array as Float32Array;

    const src = conn.sourceNode.position;
    const dst = conn.targetNode.position;

    array[0] = src.x;
    array[1] = src.y;
    array[2] = src.z;

    array[3] = dst.x;
    array[4] = dst.y;
    array[5] = dst.z;

    posAttr.needsUpdate = true;

    // Update midpoint bead position
    this.tempMidpoint.set(
      (src.x + dst.x) * 0.5,
      (src.y + dst.y) * 0.5,
      (src.z + dst.z) * 0.5
    );
    conn.midpointBead.position.copy(this.tempMidpoint);
  }

  /**
   * 2D Overlay list of active connections with instant disconnect buttons.
   */
  private buildConnectionsHUD() {
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) return;

    let hud = document.getElementById('connections-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'connections-hud';
      hud.className = 'interactive';
      hud.style.cssText = `
        position: absolute;
        top: 180px;
        right: 24px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 11px;
        color: #cbd5e1;
        backdrop-filter: blur(10px);
        max-width: 240px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      `;
      overlay.appendChild(hud);
    }
    this.refreshConnectionsHUD();
  }

  public refreshConnectionsHUD() {
    const hud = document.getElementById('connections-hud');
    if (!hud) return;

    const conns = this.getAllConnections();
    if (conns.length === 0) {
      hud.innerHTML = `
        <div style="font-weight: 700; color: #94a3b8; text-transform: uppercase; font-size: 10px;">Connections (0)</div>
        <div style="color: #64748b; font-size: 11px;">No active connections. Pinch two objects or use palette to connect.</div>
      `;
      return;
    }

    let itemsHtml = '';
    conns.forEach((c) => {
      const srcNode = this.palaceManager.getNode(c.sourceId);
      const dstNode = this.palaceManager.getNode(c.targetId);
      const srcTitle = srcNode ? srcNode.nodeData.title : c.sourceId;
      const dstTitle = dstNode ? dstNode.nodeData.title : c.targetId;

      itemsHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.1); padding: 4px 0;">
          <div style="font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">
            <span style="color:#38bdf8;">${srcTitle}</span> &harr; <span style="color:#c084fc;">${dstTitle}</span>
          </div>
          <button data-conn-id="${c.id}" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 4px; padding: 2px 6px; font-size: 9px; cursor: pointer;">&times;</button>
        </div>
      `;
    });

    hud.innerHTML = `
      <div style="font-weight: 700; color: #f1f5f9; text-transform: uppercase; font-size: 10px; display: flex; justify-content: space-between;">
        <span>Connections (${conns.length})</span>
        <span style="color: #94a3b8; font-weight: normal; font-size: 9px;">Pinch bead to cut</span>
      </div>
      <div>${itemsHtml}</div>
    `;

    hud.querySelectorAll('button[data-conn-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-conn-id');
        if (id) this.removeConnection(id);
      });
    });
  }
}
