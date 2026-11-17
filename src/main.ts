import { World, SessionMode } from '@iwsdk/core';
import { setupEnvironment } from './scene/environment';
import { XRSessionManager } from './ui/xr-session-manager';
import { PalaceSceneManager } from './objects/palace-scene-manager';
import { HandInteractionManager } from './interaction/hand-interaction-manager';
import { HandStatusHUD } from './ui/hand-status-hud';
import { SpatialPalette } from './ui/spatial-palette';
import { ConnectionManager } from './interaction/connection-manager';
import { PersistenceManager } from './storage/persistence-manager';
import { PalaceControls } from './ui/palace-controls';
import { SubjectZonesManager } from './scene/subject-zones';
import { PalaceAgentUI } from './ui/palace-agent-ui';
import { OnboardingTutorial } from './ui/onboarding-tutorial';

async function bootstrap() {
  const container = document.getElementById('scene-container');
  if (!container) {
    console.error('Scene container #scene-container not found');
    return;
  }

  // Initialize IWSDK World with native hand tracking and pinch-grab support
  const world = await World.create(container, {
    xr: {
      sessionMode: SessionMode.ImmersiveVR,
      features: {
        handTracking: true,
      },
    },
    features: {
      grabbing: {
        useHandPinchForGrab: true,
      },
    },
    render: {
      camera: {
        position: [0, 1.2, 0], // Ergonomic seated eye level
      },
    },
  });

  // Setup deep navy base with purple & cyan ambient/accent lighting
  const env = setupEnvironment(world);

  // Initialize XR session entry & unsupported device handling
  new XRSessionManager(world);

  // Initialize Palace Scene Manager
  const palaceManager = new PalaceSceneManager(world);

  // Initialize Subject Zones (DSA, AI/ML, Databases, Java/Systems)
  const zonesManager = new SubjectZonesManager(world);

  // Initialize Hand Interaction Manager & HUD
  const handManager = new HandInteractionManager(world, palaceManager);
  new HandStatusHUD(world, handManager);

  // Initialize Connection Manager
  const connectionManager = new ConnectionManager(world, palaceManager);

  // Initialize Spatial Object Creation Palette
  new SpatialPalette(world, palaceManager);

  // Initialize Palace Agent (Spawn, Suggest Connections, Flag Gaps, Quiz)
  new PalaceAgentUI(world, palaceManager, connectionManager, zonesManager);

  // Initialize Onboarding Tutorial & Visual Hand Hints
  new OnboardingTutorial(world);

  // Initialize Palace Controls (Save, Return-to-Center, Reset)
  let palaceControls: PalaceControls;

  // Initialize Persistence with IndexedDB and localStorage fallback
  const persistence = new PersistenceManager((timestamp) => {
    console.log(`[Persistence] Palace state saved at ${new Date(timestamp).toLocaleTimeString()}`);
    palaceControls?.showSaveConfirmation();
  });

  palaceControls = new PalaceControls(
    world,
    palaceManager,
    connectionManager,
    persistence
  );

  const triggerSave = () => {
    const nodes = palaceManager.getAllNodeData();
    const connections = connectionManager.getAllConnections();
    persistence.savePalace(nodes, connections);
  };

  // Wire auto-save & zone detection on node interactions
  handManager.onNodeMoved = (node) => {
    const zone = zonesManager.getZoneForPosition(node.position);
    zonesManager.highlightZone(zone ? zone.id : null);
  };

  handManager.onNodeReleased = (node) => {
    const zone = zonesManager.getZoneForPosition(node.position);
    if (zone) {
      node.nodeData.zoneId = zone.id;
      palaceControls.showSaveConfirmation(`Placed in ${zone.name}`);
    }
    zonesManager.highlightZone(null);
    triggerSave();
  };

  // Restore existing saved palace or seed default starter scene
  const savedSnapshot = await persistence.loadPalace();

  if (savedSnapshot && savedSnapshot.nodes.length > 0) {
    console.log(`[Persistence] Restoring ${savedSnapshot.nodes.length} nodes from saved snapshot`);
    savedSnapshot.nodes.forEach((nodeData) => {
      palaceManager.addNode(nodeData);
    });

    savedSnapshot.connections.forEach((connData) => {
      connectionManager.createConnection(connData.sourceId, connData.targetId, connData.label);
    });
  } else {
    // Seed initial representative knowledge objects (within 0.3m - 0.8m seated comfort zone)
    palaceManager.addNode({
      id: 'topic-dsa',
      type: 'topic',
      title: 'Data Structures & Algorithms',
      position: [-0.38, 1.25, -0.52],
      color: '#a855f7',
      zoneId: 'DSA',
      createdAt: Date.now(),
    });

    palaceManager.addNode({
      id: 'idea-binary-search',
      type: 'idea',
      title: 'Binary Search O(log n)',
      position: [-0.28, 1.15, -0.48],
      color: '#06b6d4',
      zoneId: 'DSA',
      createdAt: Date.now(),
    });

    palaceManager.addNode({
      id: 'note-complexity',
      type: 'note',
      title: 'Divide & Conquer',
      content: 'Halve the search space at each iteration. Sorted invariant required.',
      position: [-0.15, 1.18, -0.44],
      zoneId: 'DSA',
      createdAt: Date.now(),
    });

    connectionManager.createConnection('topic-dsa', 'idea-binary-search');
    connectionManager.createConnection('idea-binary-search', 'note-complexity');

    triggerSave();
  }

  // Subtle slow rotation of spatial dust
  world.onXRFrame((_frame, delta) => {
    env.spatialDust.rotation.y += delta * 0.02;
  });

  console.log('MindPalace VR initialized successfully with onboarding tutorial');
}

bootstrap().catch((err) => {
  console.error('Failed to initialize MindPalace VR:', err);
});
