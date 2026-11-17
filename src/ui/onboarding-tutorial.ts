import { World } from '@iwsdk/core';
import { spatialAudio } from '../scene/spatial-audio';

export class OnboardingTutorial {
  private world: World;
  private modalEl: HTMLElement | null = null;
  private currentStep = 0;

  private steps = [
    {
      title: 'Welcome to MindPalace VR',
      tagline: 'Your mind. Your space. Your memories.',
      icon: '&#129504;',
      body: 'You are seated in a 3D spatial memory palace. Memory palaces leverage your brain’s spatial navigation system to remember complex concepts by where you place them.',
      hint: 'Seated Ergonomics: All interactive objects stay within 0.3m to 0.8m arm’s reach.',
    },
    {
      title: 'Hands-First Interaction',
      tagline: 'Natural Pinch & Grab Manipulation',
      icon: '&#9996;',
      body: 'Look at any floating Idea Sphere, Glass Note, or Topic Node. Bring your index finger and thumb together in a pinch gesture to grab and freely reposition it anywhere in your space.',
      hint: 'IWSDK Native Input: Built-in 6DoF translation & rotation. Release your pinch to place.',
    },
    {
      title: 'Spatial Knowledge Links',
      tagline: 'Connect Related Insights',
      icon: '&#128279;',
      body: 'Draw luminous spatial links between concepts. Connections stay attached dynamically as objects are moved. Tap or pinch the midpoint bead to disconnect any link.',
      hint: 'Tip: Group related ideas into the DSA, AI/ML, Databases, or Systems subject zones.',
    },
    {
      title: 'Palace AI Agent',
      tagline: 'Your Intelligent Spatial Architect',
      icon: '&#10024;',
      body: 'Ask the Palace Agent to spawn full concept clusters, suggest logical connections between isolated ideas, flag knowledge gaps, and guide you through an interactive spatial review quiz.',
      hint: 'Ready to build: Grab ideas from the spatial palette or trigger the Agent!',
    },
  ];

  constructor(world: World) {
    this.world = world;
    this.init();
  }

  private init() {
    const overlay = document.getElementById('overlay-ui');
    if (!overlay) return;

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'interactive onboarding-modal';
    this.modalEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 20px;
      padding: 24px 28px;
      max-width: 460px;
      width: 90%;
      color: #f1f5f9;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(16px);
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    overlay.appendChild(this.modalEl);

    // Add permanent help pill to top bar
    const topBar = overlay.querySelector('.top-bar > div:last-child');
    if (topBar) {
      const tutorialBtn = document.createElement('button');
      tutorialBtn.innerHTML = '&#10067; Tutorial';
      tutorialBtn.style.cssText = `
        background: rgba(168, 85, 247, 0.15);
        color: #d8b4fe;
        border: 1px solid rgba(168, 85, 247, 0.35);
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition: all 0.2s ease;
      `;
      tutorialBtn.onclick = () => this.show(0);
      topBar.insertBefore(tutorialBtn, topBar.firstChild);
    }

    const seen = localStorage.getItem('MINDPALACE_TUTORIAL_SEEN');
    if (!seen) {
      this.show(0);
    } else {
      this.modalEl.style.display = 'none';
    }
  }

  public show(stepIndex: number = 0) {
    if (!this.modalEl) return;
    this.currentStep = stepIndex;
    this.modalEl.style.display = 'flex';
    this.renderStep();
  }

  public hide() {
    if (!this.modalEl) return;
    this.modalEl.style.display = 'none';
    localStorage.setItem('MINDPALACE_TUTORIAL_SEEN', 'true');
    spatialAudio.playHover();
  }

  private renderStep() {
    if (!this.modalEl) return;
    const step = this.steps[this.currentStep];
    const isLast = this.currentStep === this.steps.length - 1;

    let dotsHtml = '';
    for (let i = 0; i < this.steps.length; i++) {
      const active = i === this.currentStep;
      dotsHtml += `
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${
          active ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)'
        }; transition:background 0.2s;"></span>
      `;
    }

    this.modalEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">${step.icon}</span>
          <div>
            <div style="font-size:16px; font-weight:700; color:#38bdf8;">${step.title}</div>
            <div style="font-size:11px; color:#94a3b8;">${step.tagline}</div>
          </div>
        </div>
        <button id="close-tutorial-btn" style="background:none; border:none; color:#64748b; font-size:22px; cursor:pointer;">&times;</button>
      </div>

      <div style="font-size:13px; line-height:1.6; color:#cbd5e1;">
        ${step.body}
      </div>

      <div style="background:rgba(56, 189, 248, 0.1); border-left:3px solid #38bdf8; border-radius:4px; padding:8px 12px; font-size:11px; color:#7dd3fc;">
        <strong>Affordance Hint:</strong> ${step.hint}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px solid rgba(148, 163, 184, 0.15); padding-top:12px;">
        <div style="display:flex; gap:6px;">${dotsHtml}</div>
        <div style="display:flex; gap:8px;">
          ${
            this.currentStep > 0
              ? '<button id="prev-step-btn" style="background:rgba(30, 41, 59, 0.8); border:1px solid rgba(148, 163, 184, 0.3); color:#cbd5e1; border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;">Back</button>'
              : ''
          }
          <button id="next-step-btn" style="background:linear-gradient(135deg, #0284c7, #7c3aed); border:none; color:white; border-radius:8px; padding:6px 18px; font-size:12px; font-weight:600; cursor:pointer;">
            ${isLast ? 'Enter Palace' : 'Next'}
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.modalEl.querySelector('#close-tutorial-btn');
    const nextBtn = this.modalEl.querySelector('#next-step-btn');
    const prevBtn = this.modalEl.querySelector('#prev-step-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isLast) {
          this.hide();
        } else {
          this.currentStep++;
          this.renderStep();
          spatialAudio.playHover();
        }
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentStep > 0) {
          this.currentStep--;
          this.renderStep();
          spatialAudio.playHover();
        }
      });
    }
  }
}
