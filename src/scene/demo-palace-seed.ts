import type { KnowledgeNodeData, ConnectionData } from '../types/knowledge';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { ConnectionManager } from '../interaction/connection-manager';
import type { PersistenceManager } from '../storage/persistence-manager';
import { spatialAudio } from './spatial-audio';

export const DEMO_PALACE_NODES: KnowledgeNodeData[] = [
  // 1. DSA Zone
  {
    id: 'demo-topic-dsa',
    type: 'topic',
    title: 'Algorithms & Data Structures',
    position: [-0.42, 1.25, -0.52],
    color: '#06b6d4',
    zoneId: 'DSA',
    createdAt: Date.now(),
  },
  {
    id: 'demo-idea-binsearch',
    type: 'idea',
    title: 'Binary Search O(log n)',
    position: [-0.28, 1.15, -0.48],
    color: '#06b6d4',
    zoneId: 'DSA',
    createdAt: Date.now(),
  },
  {
    id: 'demo-idea-dp',
    type: 'idea',
    title: 'Dynamic Programming',
    position: [-0.48, 1.12, -0.42],
    color: '#06b6d4',
    zoneId: 'DSA',
    createdAt: Date.now(),
  },
  {
    id: 'demo-note-invariants',
    type: 'note',
    title: 'Divide & Conquer',
    content: 'Halve the search space at each iteration. Sorted invariant required.',
    position: [-0.18, 1.18, -0.42],
    zoneId: 'DSA',
    createdAt: Date.now(),
  },

  // 2. AI / ML Zone
  {
    id: 'demo-topic-ai',
    type: 'topic',
    title: 'Transformer Architecture',
    position: [0.42, 1.25, -0.52],
    color: '#a855f7',
    zoneId: 'AI_ML',
    createdAt: Date.now(),
  },
  {
    id: 'demo-idea-attention',
    type: 'idea',
    title: 'Multi-Head Attention',
    position: [0.28, 1.15, -0.48],
    color: '#a855f7',
    zoneId: 'AI_ML',
    createdAt: Date.now(),
  },
  {
    id: 'demo-idea-flash',
    type: 'idea',
    title: 'FlashAttention IO',
    position: [0.48, 1.12, -0.42],
    color: '#a855f7',
    zoneId: 'AI_ML',
    createdAt: Date.now(),
  },
  {
    id: 'demo-note-qkv',
    type: 'note',
    title: 'QKV Projection',
    content: 'Softmax(Q * K^T / sqrt(d)) * V projecting into parallel latent subspaces.',
    position: [0.18, 1.18, -0.42],
    zoneId: 'AI_ML',
    createdAt: Date.now(),
  },

  // 3. Databases Zone
  {
    id: 'demo-topic-db',
    type: 'topic',
    title: 'Database Engine Internals',
    position: [-0.52, 1.18, -0.26],
    color: '#10b981',
    zoneId: 'DATABASES',
    createdAt: Date.now(),
  },
  {
    id: 'demo-idea-wal',
    type: 'idea',
    title: 'WAL (Write-Ahead Log)',
    position: [-0.42, 1.10, -0.22],
    color: '#10b981',
    zoneId: 'DATABASES',
    createdAt: Date.now(),
  },
  {
    id: 'demo-note-acid',
    type: 'note',
    title: 'ACID Guarantees',
    content: 'Atomicity, Consistency, Isolation, and non-volatile Durability.',
    position: [-0.32, 1.15, -0.20],
    zoneId: 'DATABASES',
    createdAt: Date.now(),
  },

  // 4. Systems Zone
  {
    id: 'demo-topic-sys',
    type: 'topic',
    title: 'JVM & Concurrency',
    position: [0.52, 1.18, -0.26],
    color: '#f59e0b',
    zoneId: 'SYSTEMS',
    createdAt: Date.now(),
  },
  {
    id: 'demo-idea-threads',
    type: 'idea',
    title: 'Virtual Threads (Loom)',
    position: [0.42, 1.10, -0.22],
    color: '#f59e0b',
    zoneId: 'SYSTEMS',
    createdAt: Date.now(),
  },
];

export const DEMO_PALACE_CONNECTIONS: Array<{ sourceId: string; targetId: string; label?: string }> = [
  // DSA links
  { sourceId: 'demo-topic-dsa', targetId: 'demo-idea-binsearch', label: 'core search algorithm' },
  { sourceId: 'demo-topic-dsa', targetId: 'demo-idea-dp', label: 'optimization paradigm' },
  { sourceId: 'demo-idea-binsearch', targetId: 'demo-note-invariants', label: 'algorithmic invariant' },

  // AI links
  { sourceId: 'demo-topic-ai', targetId: 'demo-idea-attention', label: 'attention backbone' },
  { sourceId: 'demo-topic-ai', targetId: 'demo-idea-flash', label: 'hardware acceleration' },
  { sourceId: 'demo-idea-attention', targetId: 'demo-note-qkv', label: 'mathematical formulation' },

  // Databases links
  { sourceId: 'demo-topic-db', targetId: 'demo-idea-wal', label: 'durability engine' },
  { sourceId: 'demo-topic-db', targetId: 'demo-note-acid', label: 'transaction contract' },

  // Systems links
  { sourceId: 'demo-topic-sys', targetId: 'demo-idea-threads', label: 'concurrency model' },
];

export function loadDemoPalace(
  palaceManager: PalaceSceneManager,
  connectionManager: ConnectionManager,
  persistence?: PersistenceManager
) {
  // Clear current nodes
  const existing = palaceManager.getAllNodes();
  existing.forEach((n) => palaceManager.removeNode(n.nodeData.id));

  const existingConns = connectionManager.getAllConnections();
  existingConns.forEach((c) => connectionManager.removeConnection(c.id));

  // Populate rich demo objects
  DEMO_PALACE_NODES.forEach((n) => {
    palaceManager.addNode(n);
  });

  // Populate connections
  DEMO_PALACE_CONNECTIONS.forEach((c) => {
    connectionManager.createConnection(c.sourceId, c.targetId, c.label);
  });

  // Persist demo state
  if (persistence) {
    const nodes = palaceManager.getAllNodeData();
    const conns = connectionManager.getAllConnections();
    persistence.savePalace(nodes, conns);
  }

  spatialAudio.playConnect();
}
