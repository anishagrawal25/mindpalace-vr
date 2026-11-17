import {
  Color,
  FogExp2,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  DoubleSide,
  Group,
  type World,
} from '@iwsdk/core';

export interface EnvironmentAssets {
  ambientLight: AmbientLight;
  accentCyan: DirectionalLight;
  accentPurple: PointLight;
  comfortZoneRings: Group;
  spatialDust: Points;
}

/**
 * Builds the base immersive environment:
 * - Deep navy/midnight void (#060913) with exponential fog
 * - Purple (#8b5cf6) & cyan (#06b6d4) ambient & accent lighting
 * - Seated-first comfort zone visual guides (0.3m inner to 0.8m outer boundary)
 * - Subtle floating spatial particles for stereoscopic depth cues
 */
export function setupEnvironment(world: World): EnvironmentAssets {
  const scene = world.scene;

  // 1. Deep navy / midnight background & fog
  scene.background = new Color(0x060913);
  scene.fog = new FogExp2(0x060913, 0.12);

  // 2. Ambient light (deep indigo tint)
  const ambientLight = new AmbientLight(0x1e1b4b, 1.2);
  scene.add(ambientLight);

  // 3. Directional accent light: Cyan from top-left
  const accentCyan = new DirectionalLight(0x06b6d4, 1.8);
  accentCyan.position.set(-1.5, 3, 1.5);
  scene.add(accentCyan);

  // 4. Point accent light: Purple from upper-right
  const accentPurple = new PointLight(0xa855f7, 2.4, 8, 1.5);
  accentPurple.position.set(1.5, 2.2, -0.8);
  scene.add(accentPurple);

  // 5. Seated Ergonomics Rings (0.3m to 0.8m comfort zone at chest/table height y = -0.35)
  const comfortZoneRings = new Group();
  comfortZoneRings.name = 'comfortZoneRings';

  // Inner ring: 0.3m radius (close reach boundary)
  const innerRingGeo = new RingGeometry(0.295, 0.305, 64);
  const innerRingMat = new MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.25,
    side: DoubleSide,
  });
  const innerRingMesh = new Mesh(innerRingGeo, innerRingMat);
  innerRingMesh.rotation.x = -Math.PI / 2;
  innerRingMesh.position.y = -0.35;
  comfortZoneRings.add(innerRingMesh);

  // Outer ring: 0.8m radius (max seated reach boundary)
  const outerRingGeo = new RingGeometry(0.795, 0.805, 64);
  const outerRingMat = new MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.3,
    side: DoubleSide,
  });
  const outerRingMesh = new Mesh(outerRingGeo, outerRingMat);
  outerRingMesh.rotation.x = -Math.PI / 2;
  outerRingMesh.position.y = -0.35;
  comfortZoneRings.add(outerRingMesh);

  // Subtle radial floor grid rings
  for (let r = 1.2; r <= 3.0; r += 0.6) {
    const floorRingGeo = new RingGeometry(r - 0.003, r + 0.003, 64);
    const floorRingMat = new MeshBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.15,
      side: DoubleSide,
    });
    const floorRingMesh = new Mesh(floorRingGeo, floorRingMat);
    floorRingMesh.rotation.x = -Math.PI / 2;
    floorRingMesh.position.y = -0.6;
    comfortZoneRings.add(floorRingMesh);
  }

  scene.add(comfortZoneRings);

  // 6. Floating spatial dust for depth cues
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const cyanColor = new Color(0x06b6d4);
  const purpleColor = new Color(0x8b5cf6);

  for (let i = 0; i < particleCount; i++) {
    // Distribute around seated user (-1.5m to 1.5m X/Z, -0.4m to 1.4m Y)
    positions[i * 3] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

    const lerpFactor = Math.random();
    const c = cyanColor.clone().lerp(purpleColor, lerpFactor);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  dustGeo.setAttribute('color', new Float32BufferAttribute(colors, 3));

  const dustMat = new PointsMaterial({
    size: 0.012,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  });

  const spatialDust = new Points(dustGeo, dustMat);
  spatialDust.name = 'spatialDust';
  scene.add(spatialDust);

  return {
    ambientLight,
    accentCyan,
    accentPurple,
    comfortZoneRings,
    spatialDust,
  };
}
