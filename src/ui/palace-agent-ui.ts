import { World } from '@iwsdk/core';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { ConnectionManager } from '../interaction/connection-manager';
import type { SubjectZonesManager } from '../scene/subject-zones';
import { PALACE_SUBJECT_ZONES } from '../scene/subject-zones';
import { PalaceAgentClient, type AgentResult } from '../agent/agent-client';
import { spatialAudio } from '../scene/spatial-audio';

export class PalaceAgentUI {
  private world: World;
  private palaceManager: PalaceSceneManager;
  private connectionManager: ConnectionManager;
  private zonesManager: SubjectZonesManager;
  private panelEl: HTMLElement | null = null;
  private currentAgentResult: AgentResult | null = null;

  constructor(
    world: World,
    palaceManager: PalaceSceneManager,
    connectionManager: ConnectionManager,
    zonesManager: SubjectZonesManager
  ) {
    this.world = world;
    this.palaceManager = palaceManager;
    this.connectionManager = connectionManager;
    this.zonesManager = zonesManager;

    this.renderUI();
  }

  private renderUI() {
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) return;

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'interactive palace-agent-panel';
    this.panelEl.style.cssText = `
      position: absolute;
      top: 80px;
      left: 24px;
      width: 320px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 16px;
      padding: 14px 16px;
      color: #f1f5f9;
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 30;
      max-height: calc(100vh - 180px);
      overflow-y: auto;
    `;

    this.panelEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(168, 85, 247, 0.2); padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">&#10024;</span>
          <strong style="font-size: 13px; background: linear-gradient(135deg, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Palace AI Agent</strong>
        </div>
        <span style="font-size: 10px; background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); padding: 2px 6px; border-radius: 10px;">Best Agentic</span>
      </div>

      <!-- Quick Topic Generation -->
      <div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; font-weight: 600;">1. SPAWN TOPIC KNOWLEDGE TREE</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <button class="topic-preset-btn" data-topic="DSA" style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; color: #38bdf8; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">DSA</button>
          <button class="topic-preset-btn" data-topic="AI / Machine Learning" style="background: rgba(168, 85, 247, 0.15); border: 1px solid #a855f7; color: #c084fc; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">AI / ML</button>
          <button class="topic-preset-btn" data-topic="Databases" style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">Databases</button>
        </div>
      </div>

      <!-- Agent Output Container -->
      <div id="agent-output-container" style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 11px; color: #64748b; font-style: italic;">
          Select a topic above or enter a query to have Palace Agent populate ideas, suggest connections, and audit knowledge gaps.
        </div>
      </div>
    `;

    overlay.appendChild(this.panelEl);

    // Event listeners
    this.panelEl.querySelectorAll('.topic-preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const topic = (e.currentTarget as HTMLElement).getAttribute('data-topic');
        if (topic) this.runAgentQuery(topic);
      });
    });
  }

  public async runAgentQuery(topic: string) {
    const container = document.getElementById('agent-output-container');
    if (!container) return;

    container.innerHTML = `
      <div style="font-size: 11px; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
        <span class="agent-spinner">&#9696;</span>
        <span>Agent analyzing ${topic} & synthesizing spatial palace...</span>
      </div>
    `;

    const existing = this.palaceManager.getAllNodeData().map((n) => ({
      id: n.id,
      title: n.title,
      zone: n.zoneId,
    }));

    const result = await PalaceAgentClient.queryAgent(topic, existing);
    this.currentAgentResult = result;
    spatialAudio.playConnect();

    // 1. Automatically spawn generated nodes into the target zone!
    this.spawnAgentNodes(result);

    // 2. Render Agent Report (Suggestions, Gaps, Quiz)
    this.renderAgentReport(result);
  }

  private spawnAgentNodes(result: AgentResult) {
    const zoneMatch = PALACE_SUBJECT_ZONES.find((z) =>
      result.topic.toLowerCase().includes(z.id.toLowerCase()) ||
      result.topic.toLowerCase().includes(z.name.toLowerCase().slice(0, 3))
    ) || PALACE_SUBJECT_ZONES[0];

    const center = zoneMatch.center;
    const radius = 0.18;

    result.nodes.forEach((genNode, idx) => {
      const angle = (idx / result.nodes.length) * Math.PI * 2;
      const x = center[0] + radius * Math.cos(angle);
      const z = center[2] + radius * Math.sin(angle);
      const y = center[1] + (idx % 2 === 0 ? 0.08 : -0.04);

      const colors: Record<string, string> = {
        idea: '#06b6d4',
        note: '#c084fc',
        topic: '#a855f7',
      };

      this.palaceManager.addNode({
        id: `agent_${Date.now()}_${idx}`,
        type: genNode.type,
        title: genNode.title,
        content: genNode.content,
        position: [x, y, z],
        zoneId: zoneMatch.id,
        color: colors[genNode.type] || zoneMatch.color,
        createdAt: Date.now(),
      });
    });
  }

  private renderAgentReport(result: AgentResult) {
    const container = document.getElementById('agent-output-container');
    if (!container) return;

    // Build suggested connections HTML
    let connHtml = '';
    result.connections.forEach((c, idx) => {
      connHtml += `
        <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px;">
          <div style="font-size: 11px; font-weight: 600; color: #f8fafc;">
            ${c.fromTitle} &rarr; ${c.toTitle}
          </div>
          <div style="font-size: 10px; color: #94a3b8;">${c.reason}</div>
          <button class="connect-suggest-btn" data-from="${c.fromTitle}" data-to="${c.toTitle}" style="align-self: flex-start; margin-top: 2px; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; color: #38bdf8; border-radius: 4px; padding: 2px 6px; font-size: 9px; cursor: pointer;">
            + Auto-Connect
          </button>
        </div>
      `;
    });

    // Build gaps HTML
    let gapsHtml = '';
    result.gaps.forEach((gap) => {
      gapsHtml += `
        <li style="color: #fbbf24; font-size: 10px; margin-bottom: 2px;">
          ${gap}
        </li>
      `;
    });

    // Quiz HTML
    let quizHtml = '';
    if (result.quiz) {
      const q = result.quiz;
      let optHtml = '';
      q.options.forEach((opt, idx) => {
        optHtml += `
          <button class="quiz-option-btn" data-opt-idx="${idx}" style="text-align: left; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); color: #cbd5e1; border-radius: 6px; padding: 5px 8px; font-size: 10px; cursor: pointer;">
            ${String.fromCharCode(65 + idx)}. ${opt}
          </button>
        `;
      });

      quizHtml = `
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 10px; font-weight: 700; color: #d8b4fe; text-transform: uppercase;">Palace Walkthrough Quiz</div>
          <div style="font-size: 11px; color: #f8fafc; font-weight: 600;">${q.question}</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">${optHtml}</div>
          <div id="quiz-feedback" style="display: none; font-size: 10px; padding-top: 4px;"></div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="font-size: 11px; color: #22c55e; font-weight: 600;">
        &#10003; Spawned ${result.nodes.length} nodes into active zone
      </div>

      <div>
        <div style="font-size: 11px; font-weight: 600; color: #38bdf8; margin-bottom: 4px;">SUGGESTED CONNECTIONS</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">${connHtml}</div>
      </div>

      <div>
        <div style="font-size: 11px; font-weight: 600; color: #f59e0b; margin-bottom: 4px;">KNOWLEDGE GAPS FLAGGED</div>
        <ul style="padding-left: 16px; margin: 0;">${gapsHtml}</ul>
      </div>

      ${quizHtml}
    `;

    // Wire up connect buttons
    container.querySelectorAll('.connect-suggest-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const fromTitle = (e.currentTarget as HTMLElement).getAttribute('data-from');
        const toTitle = (e.currentTarget as HTMLElement).getAttribute('data-to');
        if (!fromTitle || !toTitle) return;

        const allNodes = this.palaceManager.getAllNodes();
        const fromNode = allNodes.find((n) => n.nodeData.title.toLowerCase().includes(fromTitle.toLowerCase()));
        const toNode = allNodes.find((n) => n.nodeData.title.toLowerCase().includes(toTitle.toLowerCase()));

        if (fromNode && toNode) {
          this.connectionManager.createConnection(fromNode.nodeData.id, toNode.nodeData.id);
          (e.currentTarget as HTMLElement).textContent = '&#10003; Connected';
          (e.currentTarget as HTMLElement).style.color = '#22c55e';
          (e.currentTarget as HTMLElement).style.borderColor = '#22c55e';
        }
      });
    });

    // Wire up quiz options
    if (result.quiz) {
      const q = result.quiz;
      container.querySelectorAll('.quiz-option-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const selectedIdx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-opt-idx') || '0', 10);
          const feedbackEl = document.getElementById('quiz-feedback');
          if (!feedbackEl) return;

          feedbackEl.style.display = 'block';
          if (selectedIdx === q.correctIndex) {
            feedbackEl.style.color = '#4ade80';
            feedbackEl.innerHTML = `<strong>Correct!</strong> ${q.explanation}`;
            spatialAudio.playConnect();
          } else {
            feedbackEl.style.color = '#f87171';
            feedbackEl.innerHTML = `<strong>Incorrect.</strong> Correct answer: ${q.options[q.correctIndex]}. ${q.explanation}`;
            spatialAudio.playRelease();
          }
        });
      });
    }
  }
}
