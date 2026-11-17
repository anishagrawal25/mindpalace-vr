export interface AgentGeneratedNode {
  title: string;
  type: 'idea' | 'note' | 'topic';
  content?: string;
  zone: string;
}

export interface AgentSuggestedConnection {
  fromTitle: string;
  toTitle: string;
  reason: string;
}

export interface AgentQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AgentResult {
  topic: string;
  nodes: AgentGeneratedNode[];
  connections: AgentSuggestedConnection[];
  gaps: string[];
  quiz?: AgentQuiz;
  source: 'llm' | 'deterministic_fallback';
}

const LOCAL_FALLBACKS: Record<string, AgentResult> = {
  dsa: {
    topic: 'Data Structures & Algorithms',
    nodes: [
      { title: 'Dynamic Programming', type: 'topic', content: 'Optimal substructure and overlapping subproblems.', zone: 'DSA' },
      { title: 'Memoization Cache', type: 'idea', content: 'Top-down caching of intermediate recursive results.', zone: 'DSA' },
      { title: 'Tabulation O(N)', type: 'idea', content: 'Bottom-up iterative state transitions.', zone: 'DSA' },
      { title: 'Graph BFS / DFS', type: 'idea', content: 'Queue for shortest path vs Stack for exhaustive exploration.', zone: 'DSA' },
      { title: 'Trie Index', type: 'note', content: 'O(L) string retrieval and autocomplete index.', zone: 'DSA' },
      { title: 'Heap / Priority Queue', type: 'idea', content: 'O(log N) min/max extraction for greedy problems.', zone: 'DSA' },
    ],
    connections: [
      { fromTitle: 'Dynamic Programming', toTitle: 'Memoization Cache', reason: 'Top-down implementation pattern' },
      { fromTitle: 'Dynamic Programming', toTitle: 'Tabulation O(N)', reason: 'Bottom-up space-optimized counterpart' },
      { fromTitle: 'Graph BFS / DFS', toTitle: 'Heap / Priority Queue', reason: 'Dijkstra shortest path backbone' },
    ],
    gaps: ['Balanced BSTs (AVL / Red-Black) missing from memory palace', 'Amortized time complexity card needed'],
    quiz: {
      question: 'What is the key prerequisite for performing binary search on an array?',
      options: ['Array must be uniformly distributed', 'Array elements must be strictly sorted', 'Array size must be a power of 2', 'Elements must be unique integers'],
      correctIndex: 1,
      explanation: 'Binary search requires a monotonic/sorted invariant to eliminate half the search space per iteration.',
    },
    source: 'deterministic_fallback',
  },
  ai: {
    topic: 'Artificial Intelligence & Machine Learning',
    nodes: [
      { title: 'Transformer Model', type: 'topic', content: 'Self-attention mechanism replacing sequential RNN loops.', zone: 'AI_ML' },
      { title: 'Multi-Head Attention', type: 'idea', content: 'Projects queries, keys, and values into parallel subspaces.', zone: 'AI_ML' },
      { title: 'Positional Encoding', type: 'idea', content: 'Injects sequence order into permutation-invariant attention.', zone: 'AI_ML' },
      { title: 'Vector Embeddings', type: 'note', content: 'Semantic dense vector projections in latent space.', zone: 'AI_ML' },
      { title: 'Gradient Descent', type: 'topic', content: 'Backpropagation loss optimization across parameter tensors.', zone: 'AI_ML' },
      { title: 'FlashAttention IO', type: 'idea', content: 'SRAM tiling optimization avoiding GPU memory roundtrips.', zone: 'AI_ML' },
    ],
    connections: [
      { fromTitle: 'Transformer Model', toTitle: 'Multi-Head Attention', reason: 'Core building block of transformer architecture' },
      { fromTitle: 'Transformer Model', toTitle: 'Positional Encoding', reason: 'Supplies spatial sequence context' },
      { fromTitle: 'Multi-Head Attention', toTitle: 'FlashAttention IO', reason: 'Hardware-aware acceleration' },
    ],
    gaps: ['RLHF / Alignment loop missing from post-training', 'Model Quantization (FP8/INT4) not connected to serving'],
    quiz: {
      question: 'Why is Positional Encoding required in standard Transformers?',
      options: ['To normalize gradient scales', 'Because self-attention is permutation-invariant', 'To reduce matrix multiplication dimensions', 'To prevent vanishing gradients in deep layers'],
      correctIndex: 1,
      explanation: 'Self-attention operations do not inherently encode token order; positional encodings restore sequential grammar.',
    },
    source: 'deterministic_fallback',
  },
  databases: {
    topic: 'Databases & Distributed Systems',
    nodes: [
      { title: 'ACID Guarantees', type: 'topic', content: 'Atomicity, Consistency, Isolation, and Durability.', zone: 'DATABASES' },
      { title: 'WAL (Write-Ahead Log)', type: 'idea', content: 'Sequential append-only log ensuring crash recovery durability.', zone: 'DATABASES' },
      { title: 'B+ Tree Indexing', type: 'idea', content: 'High fanout disk-friendly search tree with linked leaves.', zone: 'DATABASES' },
      { title: 'LSM Trees (RocksDB)', type: 'idea', content: 'MemTable + SSTables optimized for write-heavy workloads.', zone: 'DATABASES' },
      { title: 'CAP Theorem', type: 'note', content: 'Trade-off between Consistency, Availability, and Partition Tolerance.', zone: 'DATABASES' },
      { title: 'Raft Consensus', type: 'idea', content: 'Leader election and replicated state machine protocol.', zone: 'DATABASES' },
    ],
    connections: [
      { fromTitle: 'ACID Guarantees', toTitle: 'WAL (Write-Ahead Log)', reason: 'Durability implementation mechanism' },
      { fromTitle: 'B+ Tree Indexing', toTitle: 'LSM Trees (RocksDB)', reason: 'Read-optimized vs write-optimized storage engines' },
      { fromTitle: 'CAP Theorem', toTitle: 'Raft Consensus', reason: 'Consistency mechanism during network partitions' },
    ],
    gaps: ['MVCC (Multi-Version Concurrency Control) not mapped', 'Distributed 2PC (Two-Phase Commit) card missing'],
    quiz: {
      question: 'Which component ensures the Durability property in relational database transaction engines?',
      options: ['Query Planner', 'Write-Ahead Log (WAL)', 'Connection Pooler', 'LRU Buffer Pool'],
      correctIndex: 1,
      explanation: 'Changes are flushed to the append-only Write-Ahead Log on non-volatile disk before committing transactions.',
    },
    source: 'deterministic_fallback',
  },
};

export class PalaceAgentClient {
  public static async queryAgent(
    topic: string,
    existingNodes: Array<{ id: string; title: string; zone?: string }> = []
  ): Promise<AgentResult> {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          existingNodes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.nodes && data.nodes.length > 0) {
          return data as AgentResult;
        }
      }
    } catch (err) {
      console.warn('[AgentClient] Remote /api/agent call failed or offline, using robust client fallback:', err);
    }

    // Client-side fallback: guarantees instant, zero-latency response even in offline sandbox
    const key = topic.toLowerCase().includes('ai') || topic.toLowerCase().includes('ml')
      ? 'ai'
      : topic.toLowerCase().includes('data') || topic.toLowerCase().includes('sql') || topic.toLowerCase().includes('db')
      ? 'databases'
      : 'dsa';

    return LOCAL_FALLBACKS[key] || LOCAL_FALLBACKS.dsa;
  }
}
