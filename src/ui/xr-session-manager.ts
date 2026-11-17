import { World, SessionMode, launchXR } from '@iwsdk/core';

export class XRSessionManager {
  private world: World;
  private container: HTMLElement;
  private vrButton: HTMLButtonElement | null = null;
  private statusBadge: HTMLElement | null = null;
  private infoModal: HTMLElement | null = null;
  private isVRSupported: boolean = false;

  constructor(world: World) {
    this.world = world;
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) {
      throw new Error('Overlay UI container #overlay-ui not found');
    }
    this.container = overlay;
    this.init();
  }

  private async init() {
    // Check WebXR Immersive VR support
    if (typeof navigator !== 'undefined' && 'xr' in navigator && navigator.xr) {
      try {
        this.isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
      } catch (err) {
        console.warn('WebXR isSessionSupported check failed:', err);
        this.isVRSupported = false;
      }
    } else {
      this.isVRSupported = false;
    }

    this.renderUI();
    this.attachSessionListeners();
  }

  private renderUI() {
    // Top Bar with Development Preview indicator & Quest Instructions
    const topBar = document.createElement('div');
    topBar.className = 'top-bar interactive';
    topBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 16px;
    `;

    // Title & Tagline
    const brand = document.createElement('div');
    brand.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #38bdf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MindPalace VR</span>
        <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">Meta Quest / WebXR</span>
      </div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Your mind. Your space. Your memories.</div>
    `;
    topBar.appendChild(brand);

    // Right Side: Mode status & Info button
    const rightSide = document.createElement('div');
    rightSide.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    // Mode Status Badge (Strict Integrity: clearly state preview when not in VR)
    this.statusBadge = document.createElement('div');
    this.updateStatusBadge();
    rightSide.appendChild(this.statusBadge);

    // Help / Instructions button
    const helpBtn = document.createElement('button');
    helpBtn.innerHTML = '&#9432; Quest Info';
    helpBtn.style.cssText = `
      background: rgba(30, 41, 59, 0.7);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    `;
    helpBtn.onclick = () => this.toggleInfoModal();
    rightSide.appendChild(helpBtn);

    topBar.appendChild(rightSide);
    this.container.appendChild(topBar);

    // Bottom Action Area: Enter VR Button
    const bottomBar = document.createElement('div');
    bottomBar.className = 'bottom-bar interactive';
    bottomBar.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    `;

    this.vrButton = document.createElement('button');
    this.updateVRButton();
    bottomBar.appendChild(this.vrButton);

    const seatedHint = document.createElement('div');
    seatedHint.textContent = 'Ergonomic seated-first zone: objects placed within arm’s reach (0.3m–0.8m)';
    seatedHint.style.cssText = `
      font-size: 11px;
      color: #64748b;
      letter-spacing: 0.2px;
    `;
    bottomBar.appendChild(seatedHint);

    this.container.appendChild(bottomBar);

    // Modal popup for Quest instructions
    this.createInfoModal();
  }

  private updateStatusBadge() {
    if (!this.statusBadge) return;

    if (this.world.session) {
      this.statusBadge.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-right: 6px; box-shadow: 0 0 8px #22c55e;"></span>
        <strong style="color: #22c55e;">Immersive VR Active</strong>
      `;
      this.statusBadge.style.cssText = `
        padding: 6px 12px;
        border-radius: 20px;
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.3);
        font-size: 12px;
        display: flex;
        align-items: center;
      `;
    } else if (this.isVRSupported) {
      this.statusBadge.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; margin-right: 6px; box-shadow: 0 0 8px #38bdf8;"></span>
        <span style="color: #38bdf8;">VR Ready (Headset Detected)</span>
      `;
      this.statusBadge.style.cssText = `
        padding: 6px 12px;
        border-radius: 20px;
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.3);
        font-size: 12px;
        display: flex;
        align-items: center;
      `;
    } else {
      // Required integrity wording
      this.statusBadge.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; margin-right: 6px;"></span>
        <span style="color: #fbbf24;">Development Preview, not VR</span>
      `;
      this.statusBadge.style.cssText = `
        padding: 6px 12px;
        border-radius: 20px;
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.3);
        font-size: 12px;
        display: flex;
        align-items: center;
      `;
    }
  }

  private updateVRButton() {
    if (!this.vrButton) return;

    if (this.world.session) {
      this.vrButton.textContent = 'EXIT IMMERSIVE VR';
      this.vrButton.style.cssText = `
        padding: 14px 32px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.5px;
        border-radius: 30px;
        border: 1px solid rgba(239, 68, 68, 0.4);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.4));
        color: #fca5a5;
        cursor: pointer;
        backdrop-filter: blur(12px);
        transition: all 0.2s ease;
      `;
      this.vrButton.onclick = () => {
        if (this.world.session) {
          this.world.session.end().catch(console.error);
        }
      };
    } else if (this.isVRSupported) {
      this.vrButton.textContent = 'ENTER IMMERSIVE VR';
      this.vrButton.style.cssText = `
        padding: 14px 36px;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.6px;
        border-radius: 30px;
        border: 1px solid rgba(56, 189, 248, 0.6);
        background: linear-gradient(135deg, #0284c7, #7c3aed);
        color: #ffffff;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(56, 189, 248, 0.35);
        backdrop-filter: blur(12px);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      `;
      this.vrButton.onclick = () => this.requestVRSession();
    } else {
      this.vrButton.textContent = 'ENTER VR (UNAVAILABLE ON THIS BROWSER)';
      this.vrButton.style.cssText = `
        padding: 12px 28px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 30px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(30, 41, 59, 0.6);
        color: #94a3b8;
        cursor: pointer;
        backdrop-filter: blur(8px);
      `;
      this.vrButton.onclick = () => this.toggleInfoModal(true);
    }
  }

  private async requestVRSession() {
    try {
      launchXR(this.world, {
        sessionMode: SessionMode.ImmersiveVR,
        features: {
          handTracking: true,
        },
      });
      // Allow session state listener to update UI
      setTimeout(() => {
        this.updateStatusBadge();
        this.updateVRButton();
      }, 500);
    } catch (err: any) {
      console.error('Failed to launch WebXR session:', err);
      alert(`Could not start WebXR Immersive Session: ${err?.message || err}`);
    }
  }

  private attachSessionListeners() {
    // Poll session changes or listen to XR frame loop
    let lastSession = this.world.session;
    this.world.onXRFrame(() => {
      if (this.world.session !== lastSession) {
        lastSession = this.world.session;
        this.updateStatusBadge();
        this.updateVRButton();

        if (lastSession) {
          lastSession.addEventListener('end', () => {
            lastSession = undefined;
            this.updateStatusBadge();
            this.updateVRButton();
          });
        }
      }
    });
  }

  private createInfoModal() {
    this.infoModal = document.createElement('div');
    this.infoModal.className = 'interactive';
    this.infoModal.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 16px;
      padding: 24px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      z-index: 100;
      color: #e2e8f0;
    `;

    this.infoModal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 18px; color: #38bdf8; font-weight: 700;">Meta Quest & WebXR Guide</h3>
        <button id="close-modal-btn" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
        <p style="margin-bottom: 12px;"><strong>For Competition Judges on Meta Quest:</strong></p>
        <ol style="margin-left: 20px; margin-bottom: 14px;">
          <li>Put on your <strong>Meta Quest 2, 3, 3S, or Pro</strong>.</li>
          <li>Open the <strong>Meta Quest Browser</strong>.</li>
          <li>Navigate to this URL.</li>
          <li>Click the purple <strong>ENTER IMMERSIVE VR</strong> button.</li>
          <li>Put down your controllers — <strong>native hand tracking</strong> will activate automatically! Pinch, grab, and connect spatial knowledge objects with your bare hands.</li>
        </ol>
        <p style="margin-bottom: 8px;"><strong>On Desktop / Laptop (Development Preview):</strong></p>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 14px;">
          You are currently in <em>Development Preview, not VR</em> mode. You can test scene layout, creation palettes, agent queries, and connections using mouse & pointer interaction.
        </p>
        <div style="text-align: right;">
          <button id="modal-ok-btn" style="background: #0284c7; color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;">Got It</button>
        </div>
      </div>
    `;

    this.container.appendChild(this.infoModal);

    const closeBtn = this.infoModal.querySelector('#close-modal-btn');
    const okBtn = this.infoModal.querySelector('#modal-ok-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggleInfoModal(false));
    if (okBtn) okBtn.addEventListener('click', () => this.toggleInfoModal(false));
  }

  public toggleInfoModal(forceOpen?: boolean) {
    if (!this.infoModal) return;
    const shouldShow = forceOpen !== undefined ? forceOpen : this.infoModal.style.display === 'none';
    this.infoModal.style.display = shouldShow ? 'block' : 'none';
  }
}
