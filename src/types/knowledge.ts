export type KnowledgeType = 'idea' | 'note' | 'topic';

export type VisualState = 'idle' | 'hovered' | 'selected' | 'grabbed';

export interface KnowledgeNodeData {
  id: string;
  type: KnowledgeType;
  title: string;
  content?: string;
  position: [number, number, number];
  zoneId?: string;
  color?: string;
  tags?: string[];
  createdAt: number;
}

export interface ConnectionData {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  createdAt: number;
}

export interface SubjectZoneData {
  id: string;
  name: string;
  description: string;
  center: [number, number, number]; // Center position in space
  radius: number;
  color: string;
}
