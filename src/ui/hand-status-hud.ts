import { World } from '@iwsdk/core';
import type { HandInteractionManager, HandStatus } from '../interaction/hand-interaction-manager';

export class HandStatusHUD {
  private container: HTMLElement;
  private hudElement: HTMLElement;
  private handManager: HandInteractionManager;

  constructor(world: World, handManager: HandInteractionManager) {
    this.handManager = handManager;
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) throw new Error('#overlay-ui not found');
    this.container = overlay;

    this.hudElement = document.createElement('div');
    this.hudElement.className = 'interactive hand-hud';
    this.hudElement.style.cssText = `
      position: absolute;
      top: 80px;
      right: 24px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 11px;
      color: #94a3b8;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      min-width: 180px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    this.container.appendChild(this.hudElement);
    this.handManager.subscribe((status) => this.render(status));
  }

  private render(status: HandStatus) {
    const leftText = status.leftDetected
      ? status.leftIsHand
        ? '<span style="color:#22c55e;">Tracked Hand</span>'
        : '<span style="color:#38bdf8;">Controller</span>'
      : '<span style="color:#64748b;">Not detected</span>';

    const rightText = status.rightDetected
      ? status.rightIsHand
        ? '<span style="color:#22c55e;">Tracked Hand</span>'
        : '<span style="color:#38bdf8;">Controller</span>'
      : '<span style="color:#64748b;">Not detected</span>';

    const trackingMode =
      status.leftIsHand || status.rightIsHand
        ? '<span style="color:#a855f7; font-weight:600;">Quest Bare Hand Tracking</span>'
        : '<span style="color:#64748b;">Desktop Emulation / Controller</span>';

    this.hudElement.innerHTML = `
      <div style="font-weight: 700; color: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(148, 163, 184, 0.15); padding-bottom: 4px;">
        Input Tracking State
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Left Hand:</span>
        <strong>${leftText}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Right Hand:</span>
        <strong>${rightText}</strong>
      </div>
      <div style="margin-top: 2px; padding-top: 4px; border-top: 1px dashed rgba(148, 163, 184, 0.15); font-size: 10px;">
        Mode: ${trackingMode}
      </div>
    `;
  }
}
