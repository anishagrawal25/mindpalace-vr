import { World, Vector3 } from '@iwsdk/core';
import type { PalaceSceneManager } from '../objects/palace-scene-manager';
import type { ConnectionManager } from '../interaction/connection-manager';
import type { PersistenceManager } from '../storage/persistence-manager';
import { spatialAudio } from '../scene/spatial-audio';

export class PalaceControls {
  private world: World;
  private palaceManager: PalaceSceneManager;
  private connectionManager: ConnectionManager;
  private persistence: PersistenceManager;
  private toastEl: HTMLElement | null = null;
  private toastTimeout: any = null;

  constructor(
    world: World,
    palaceManager: PalaceSceneManager,
    connectionManager: ConnectionManager,
    persistence: PersistenceManager
  ) {
    this.world = world;
    this.palaceManager = palaceManager;
    this.connectionManager = connectionManager;
    this.persistence = persistence;

    this.createUI();
  }

  private createUI() {
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) return;

    // Save Confirmation Toast
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'interactive save-toast';
    this.toastEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      padding: 10px 18px;
      border-radius: 24px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
      z-index: 100;
    `;
    this.toastEl.innerHTML = `
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e;"></span>
      <span>Palace Saved (IndexedDB)</span>
    `;
    overlay.appendChild(this.toastEl);

    // Control bar for Return-to-Center and Reset
    const controlBar = document.createElement('div');
    controlBar.className = 'interactive';
    controlBar.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 30px;
      padding: 6px 14px;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      z-index: 50;
    `;

    // Return to Center button
    const recenterBtn = document.createElement('button');
    recenterBtn.innerHTML = '&#8634; Return to Center';
    recenterBtn.style.cssText = `
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    recenterBtn.onclick = () => this.returnToCenter();
    controlBar.appendChild(recenterBtn);

    // Save Palace button
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '&#128190; Save Palace';
    saveBtn.style.cssText = `
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    saveBtn.onclick = () => this.manualSave();
    controlBar.appendChild(saveBtn);

    // Reset Space button
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '&#9851; Reset Space';
    resetBtn.style.cssText = `
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    resetBtn.onclick = () => this.confirmReset();
    controlBar.appendChild(resetBtn);

    overlay.appendChild(controlBar);
  }

  public showSaveConfirmation(msg?: string) {
    if (!this.toastEl) return;
    if (msg) {
      this.toastEl.querySelector('span:last-child')!.textContent = msg;
    }
    this.toastEl.style.opacity = '1';
    this.toastEl.style.transform = 'translateY(0)';

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.toastEl) {
        this.toastEl.style.opacity = '0';
        this.toastEl.style.transform = 'translateY(10px)';
      }
    }, 2400);
  }

  public manualSave() {
    const nodes = this.palaceManager.getAllNodeData();
    const connections = this.connectionManager.getAllConnections();
    this.persistence.savePalace(nodes, connections);
    spatialAudio.playHover();
    this.showSaveConfirmation('Palace State Saved!');
  }

  /**
   * Smoothly returns the user's viewpoint to origin [0, 1.2, 0] facing forward.
   */
  public returnToCenter() {
    // Reset camera local position and rotation
    this.world.camera.position.set(0, 1.2, 0);
    this.world.camera.rotation.set(0, 0, 0);

    // If world player / XR origin is offset, return it to ground zero
    if (this.world.player) {
      this.world.player.position.set(0, 0, 0);
      this.world.player.rotation.set(0, 0, 0);
    }

    spatialAudio.playHover();
    this.showSaveConfirmation('Returned to Seated Center');
  }

  /**
   * Prompts user and resets the palace space to default clean layout.
   */
  public confirmReset() {
    const ok = window.confirm('Reset MindPalace? This will clear all placed objects and saved memory connections.');
    if (!ok) return;

    // Remove all existing nodes and connections
    const nodes = this.palaceManager.getAllNodes();
    nodes.forEach((n) => {
      this.palaceManager.removeNode(n.nodeData.id);
    });

    const conns = this.connectionManager.getAllConnections();
    conns.forEach((c) => {
      this.connectionManager.removeConnection(c.id);
    });

    // Clear persistence
    this.persistence.clearPalace();

    // Re-seed clean starting node
    this.palaceManager.addNode({
      id: 'topic-dsa-seed',
      type: 'topic',
      title: 'Data Structures & Algorithms',
      position: [0, 1.25, -0.55],
      color: '#a855f7',
      createdAt: Date.now(),
    });

    spatialAudio.playRelease();
    this.showSaveConfirmation('Palace Reset to Default');
  }
}
