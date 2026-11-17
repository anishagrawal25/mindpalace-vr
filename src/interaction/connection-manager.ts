import {
  World,
  Group,
  Line,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  Vector3,
  Color,
} from '@iwsdk/core';
import type { ConnectionData } from '../types/knowledge';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { KnowledgeObjectContainer } from '../objects/knowledge-mesh-factory';
import { spatialAudio } from '../scene/spatial-audio';

interface RenderedConnection {
  data: ConnectionData;
  line: Line;
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

  private vSource = new Vector3();
  private vTarget = new Vector3();

  constructor(world: World, palaceManager: PalaceSceneManager) {
    this.world = world;
    this.palaceManager = palaceManager;

    this.connectionGroup = new Group();
    this.connectionGroup.name = 'palace_connections';
    this.world.scene.add(this.connectionGroup);

    this.setupPreviewLine();
    this.initLiveUpdateLoop();
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
   * Completes connection between two nodes.
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

    const posArray = new Float32Array(6);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(posArray, 3));

    const mat = new LineBasicMaterial({
      color: new Color(0xa855f7).lerp(new Color(0x06b6d4), 0.5),
      linewidth: 3,
      transparent: true,
      opacity: 0.75,
    });

    const line = new Line(geo, mat);
    line.name = connectionId;
    this.connectionGroup.add(line);

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
      sourceNode,
      targetNode,
    };

    this.connections.set(connectionId, rendered);
    this.updateSingleConnection(rendered);

    this.cancelConnectionPreview();
    spatialAudio.playConnect();

    return data;
  }

  /**
   * Removes an existing connection by ID.
   */
  public removeConnection(connectionId: string): boolean {
    const conn = this.connections.get(connectionId);
    if (!conn) return false;

    this.connectionGroup.remove(conn.line);
    conn.line.geometry.dispose();
    if (conn.line.material instanceof LineBasicMaterial) {
      conn.line.material.dispose();
    }
    this.connections.delete(connectionId);
    return true;
  }

  public getAllConnections(): ConnectionData[] {
    return Array.from(this.connections.values()).map((c) => c.data);
  }

  /**
   * Live update loop: ensures all spatial connection lines stay attached
   * smoothly whenever either attached node is moved in 3D space!
   */
  private initLiveUpdateLoop() {
    this.world.onXRFrame(() => {
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
  }
}
