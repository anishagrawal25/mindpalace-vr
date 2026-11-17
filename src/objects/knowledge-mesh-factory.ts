import {
  Group,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  IcosahedronGeometry,
  TorusGeometry,
  PlaneGeometry,
  Color,
  Vector3,
  AdditiveBlending,
  DoubleSide,
} from '@iwsdk/core';
import type { KnowledgeNodeData, VisualState } from '../types/knowledge';
import { createLabelTexture, createCardTexture } from './text-texture-generator';

export interface KnowledgeObjectContainer extends Group {
  nodeData: KnowledgeNodeData;
  visualState: VisualState;
  setVisualState: (state: VisualState) => void;
  updateTick?: (delta: number) => void;
}

export function createKnowledgeObject(data: KnowledgeNodeData): KnowledgeObjectContainer {
  const container = new Group() as KnowledgeObjectContainer;
  container.name = `node_${data.id}`;
  container.nodeData = { ...data };
  container.visualState = 'idle';
  container.position.set(data.position[0], data.position[1], data.position[2]);

  let coreMesh: Mesh;
  let auraMesh: Mesh | null = null;
  let ringMesh: Mesh | null = null;
  let labelPlane: Mesh | null = null;

  if (data.type === 'idea') {
    // 1. Glowing Sphere (Radius 0.05m = 5cm, compact and reachable)
    const sphereGeo = new SphereGeometry(0.048, 32, 32);
    const sphereColor = new Color(data.color || 0x06b6d4);

    const sphereMat = new MeshStandardMaterial({
      color: sphereColor,
      emissive: sphereColor,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.8,
    });
    coreMesh = new Mesh(sphereGeo, sphereMat);
    container.add(coreMesh);

    // Outer translucent aura
    const auraGeo = new SphereGeometry(0.062, 24, 24);
    const auraMat = new MeshBasicMaterial({
      color: sphereColor,
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    auraMesh = new Mesh(auraGeo, auraMat);
    container.add(auraMesh);

    // Floating Label above sphere
    const labelTex = createLabelTexture(data.title, 'IDEA', data.color || '#06b6d4');
    const labelGeo = new PlaneGeometry(0.18, 0.056);
    const labelMat = new MeshBasicMaterial({
      map: labelTex,
      transparent: true,
      side: DoubleSide,
    });
    labelPlane = new Mesh(labelGeo, labelMat);
    labelPlane.position.set(0, 0.08, 0);
    container.add(labelPlane);

  } else if (data.type === 'note') {
    // 2. Floating Glass Card (Width 0.22m, Height 0.155m)
    const cardTex = createCardTexture(
      data.title,
      data.content || 'Tap to expand or connect note to an idea node.',
      data.zoneId
    );
    const cardGeo = new PlaneGeometry(0.22, 0.155);
    const cardMat = new MeshStandardMaterial({
      map: cardTex,
      transparent: true,
      opacity: 0.95,
      roughness: 0.2,
      metalness: 0.1,
      side: DoubleSide,
    });
    coreMesh = new Mesh(cardGeo, cardMat);
    container.add(coreMesh);

    // Subtle edge rim border
    const borderGeo = new PlaneGeometry(0.224, 0.159);
    const borderMat = new MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.3,
      side: DoubleSide,
    });
    auraMesh = new Mesh(borderGeo, borderMat);
    auraMesh.position.z = -0.002;
    container.add(auraMesh);

  } else {
    // 3. Topic Node (Faceted Icosahedron, Radius 0.075m)
    const topicGeo = new IcosahedronGeometry(0.068, 1);
    const topicColor = new Color(data.color || 0x8b5cf6);

    const topicMat = new MeshStandardMaterial({
      color: topicColor,
      emissive: topicColor,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true,
    });
    coreMesh = new Mesh(topicGeo, topicMat);
    container.add(coreMesh);

    // Orbiting Torus Ring
    const torusGeo = new TorusGeometry(0.095, 0.003, 16, 64);
    const torusMat = new MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
    });
    ringMesh = new Mesh(torusGeo, torusMat);
    ringMesh.rotation.x = Math.PI / 3;
    container.add(ringMesh);

    // Label above topic node
    const labelTex = createLabelTexture(data.title, 'TOPIC', data.color || '#8b5cf6');
    const labelGeo = new PlaneGeometry(0.24, 0.075);
    const labelMat = new MeshBasicMaterial({
      map: labelTex,
      transparent: true,
      side: DoubleSide,
    });
    labelPlane = new Mesh(labelGeo, labelMat);
    labelPlane.position.set(0, 0.11, 0);
    container.add(labelPlane);
  }

  // Animation tick (e.g. rotating topic ring or aura pulse)
  container.updateTick = (delta: number) => {
    if (ringMesh) {
      const rotSpeed = container.visualState === 'hovered' || container.visualState === 'grabbed' ? 2.5 : 0.8;
      ringMesh.rotation.z += delta * rotSpeed;
    }
  };

  // State Transition function
  container.setVisualState = (state: VisualState) => {
    container.visualState = state;

    switch (state) {
      case 'idle':
        container.scale.set(1.0, 1.0, 1.0);
        if (coreMesh.material instanceof MeshStandardMaterial) {
          coreMesh.material.emissiveIntensity = data.type === 'idea' ? 0.6 : 0.4;
        }
        if (auraMesh && auraMesh.material instanceof MeshBasicMaterial) {
          auraMesh.material.opacity = 0.35;
        }
        break;

      case 'hovered':
        container.scale.set(1.08, 1.08, 1.08);
        if (coreMesh.material instanceof MeshStandardMaterial) {
          coreMesh.material.emissiveIntensity = 1.1;
        }
        if (auraMesh && auraMesh.material instanceof MeshBasicMaterial) {
          auraMesh.material.opacity = 0.75;
        }
        break;

      case 'selected':
        container.scale.set(1.12, 1.12, 1.12);
        if (coreMesh.material instanceof MeshStandardMaterial) {
          coreMesh.material.emissiveIntensity = 1.4;
        }
        if (auraMesh && auraMesh.material instanceof MeshBasicMaterial) {
          auraMesh.material.opacity = 0.9;
        }
        break;

      case 'grabbed':
        container.scale.set(1.15, 1.15, 1.15);
        if (coreMesh.material instanceof MeshStandardMaterial) {
          coreMesh.material.emissiveIntensity = 1.6;
        }
        if (auraMesh && auraMesh.material instanceof MeshBasicMaterial) {
          auraMesh.material.opacity = 0.95;
        }
        break;
    }
  };

  return container;
}
