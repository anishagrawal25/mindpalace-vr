import {
  World,
  Group,
  Mesh,
  RingGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  CanvasTexture,
  SRGBColorSpace,
  DoubleSide,
  Vector3,
  Color,
} from '@iwsdk/core';
import type { SubjectZoneData } from '../types/knowledge';
import type { KnowledgeObjectContainer } from '../objects/knowledge-mesh-factory';
import { roundRect } from '../objects/text-texture-generator';

export const PALACE_SUBJECT_ZONES: SubjectZoneData[] = [
  {
    id: 'DSA',
    name: 'Algorithms & Data Structures',
    description: 'Trees, Graphs, DP, Search invariants',
    center: [-0.38, 1.05, -0.52],
    radius: 0.28,
    color: '#06b6d4',
  },
  {
    id: 'AI_ML',
    name: 'AI & Machine Learning',
    description: 'Attention, Embeddings, Backprop, Loss',
    center: [0.38, 1.05, -0.52],
    radius: 0.28,
    color: '#a855f7',
  },
  {
    id: 'DATABASES',
    name: 'Databases & Storage',
    description: 'ACID, WAL, B+ Trees, LSM, Sharding',
    center: [-0.48, 1.05, -0.28],
    radius: 0.26,
    color: '#10b981',
  },
  {
    id: 'SYSTEMS',
    name: 'Java & Systems Architecture',
    description: 'JVM, Concurrency, Memory Model, GC',
    center: [0.48, 1.05, -0.28],
    radius: 0.26,
    color: '#f59e0b',
  },
];

export class SubjectZonesManager {
  private world: World;
  private zonesGroup: Group;
  private zoneMeshes: Map<string, { ring: Mesh; label: Mesh; mat: MeshBasicMaterial }> = new Map();

  constructor(world: World) {
    this.world = world;
    this.zonesGroup = new Group();
    this.zonesGroup.name = 'subject_zones';
    this.world.scene.add(this.zonesGroup);

    this.buildZones();
  }

  private buildZones() {
    PALACE_SUBJECT_ZONES.forEach((zone) => {
      const zoneColor = new Color(zone.color);

      // 1. Boundary Floor Ring (at y = 0.9m chest/table level)
      const ringGeo = new RingGeometry(zone.radius - 0.005, zone.radius, 48);
      const ringMat = new MeshBasicMaterial({
        color: zoneColor,
        transparent: true,
        opacity: 0.35,
        side: DoubleSide,
      });
      const ringMesh = new Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(zone.center[0], 0.9, zone.center[2]);
      this.zonesGroup.add(ringMesh);

      // 2. Floating 3D Zone Label Banner
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 512;
      labelCanvas.height = 128;
      const ctx = labelCanvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 4;
      roundRect(ctx, 8, 8, 496, 112, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = zone.color;
      ctx.font = 'bold 24px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name.toUpperCase(), 256, 50);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px -apple-system, sans-serif';
      ctx.fillText(zone.description, 256, 85);

      const labelTex = new CanvasTexture(labelCanvas);
      labelTex.colorSpace = SRGBColorSpace;

      const labelGeo = new PlaneGeometry(0.24, 0.06);
      const labelMat = new MeshBasicMaterial({
        map: labelTex,
        transparent: true,
        side: DoubleSide,
      });
      const labelMesh = new Mesh(labelGeo, labelMat);
      labelMesh.position.set(zone.center[0], 0.95, zone.center[2] - zone.radius * 0.8);
      labelMesh.rotation.x = -Math.PI / 8; // Slight upward tilt
      this.zonesGroup.add(labelMesh);

      this.zoneMeshes.set(zone.id, { ring: ringMesh, label: labelMesh, mat: ringMat });
    });
  }

  /**
   * Identifies which subject zone (if any) contains the given 3D coordinates.
   */
  public getZoneForPosition(pos: [number, number, number] | Vector3): SubjectZoneData | null {
    const px = 'x' in pos ? pos.x : pos[0];
    const pz = 'z' in pos ? pos.z : pos[2];

    for (const zone of PALACE_SUBJECT_ZONES) {
      const dx = px - zone.center[0];
      const dz = pz - zone.center[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= zone.radius) {
        return zone;
      }
    }
    return null;
  }

  /**
   * Highlights zone ring when an object is being dragged inside its region.
   */
  public highlightZone(zoneId: string | null) {
    this.zoneMeshes.forEach((meshObj, id) => {
      meshObj.mat.opacity = id === zoneId ? 0.75 : 0.35;
    });
  }
}
