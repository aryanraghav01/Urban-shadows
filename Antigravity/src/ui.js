/**
 * Urban Shadows - Class Presentation UI Controller Manager
 */
class UIManager {
  constructor() {
    this.healthBar = document.getElementById('health-bar');
    this.staminaBar = document.getElementById('stamina-bar');
    this.cashVal = document.getElementById('cash-val');
    this.objectiveText = document.getElementById('objective-text');
    this.wantedStars = document.querySelectorAll('#wanted-stars .star');
    this.clickPrompt = document.getElementById('click-prompt');
    this.pauseModal = document.getElementById('pause-modal');
    this.techModal = document.getElementById('tech-modal');

    this.btnStart = document.getElementById('btn-start');
    this.btnResume = document.getElementById('btn-resume');
    this.btnResetPos = document.getElementById('btn-reset-pos');
    this.btnCloseTech = document.getElementById('btn-close-tech');

    // Navbar & Toolbar Buttons
    this.btnNavLighting = document.getElementById('btn-nav-lighting');
    this.btnNavTeleport = document.getElementById('btn-nav-teleport');
    this.btnNavSpecs = document.getElementById('btn-nav-specs');
    this.btnNavFullscreen = document.getElementById('btn-nav-fullscreen');
    this.lightingLabel = document.getElementById('lighting-label');

    this.barBtnCar = document.getElementById('bar-btn-car');
    this.barBtnLight = document.getElementById('bar-btn-light');
    this.barBtnSpecs = document.getElementById('bar-btn-specs');
    this.barBtnReset = document.getElementById('bar-btn-reset');

    // Speedometer & Interaction Prompt
    this.speedometerCard = document.getElementById('speedometer-card');
    this.speedVal = document.getElementById('speed-val');
    this.interactPrompt = document.getElementById('interact-prompt');
    this.interactText = document.getElementById('interact-text');

    // Minimap canvas setup
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.isPaused = false;
    this.isTechOpen = false;
    this.lightingMode = 0; // 0: Night Neon, 1: Sunset, 2: Daylight

    this.initEvents();
    this.initTabs();
    this.init3DTilt();
  }

  init3DTilt() {
    const cards = document.querySelectorAll('.modal-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (-y / (rect.height / 2)) * 8;
        const rotateY = (x / (rect.width / 2)) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  initTabs() {
    const tabBtns = document.querySelectorAll('.modal-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  initEvents() {
    const dismissStart = (e) => {
      this.hideStartPrompt();
      if (window.gameInstance) {
        window.gameInstance.requestPointerLock();
      }
    };

    if (this.btnStart) {
      this.btnStart.addEventListener('click', dismissStart);
    }

    if (this.btnResume) {
      this.btnResume.addEventListener('click', () => {
        this.resumeGame();
      });
    }

    if (this.btnCloseTech) {
      this.btnCloseTech.addEventListener('click', () => {
        this.toggleTechOverlay();
      });
    }

    if (this.btnResetPos) {
      this.btnResetPos.addEventListener('click', () => this.resetPlayerOrCar());
    }
    if (this.barBtnReset) {
      this.barBtnReset.addEventListener('click', () => this.resetPlayerOrCar());
    }

    // Teleport Buttons
    const doTeleport = () => {
      if (window.gameInstance && window.gameInstance.vehicle) {
        const vPos = window.gameInstance.vehicle.mesh.position;
        if (!window.gameInstance.isDrivingVehicle && window.gameInstance.player) {
          window.gameInstance.player.mesh.position.set(vPos.x + 2, 0, vPos.z + 2);
          window.gameInstance.setObjective("Teleported near Sports Car! Press E to enter car.");
        }
      }
    };

    if (this.btnNavTeleport) this.btnNavTeleport.addEventListener('click', doTeleport);
    if (this.barBtnCar) this.barBtnCar.addEventListener('click', doTeleport);

    // Specs Buttons
    if (this.btnNavSpecs) this.btnNavSpecs.addEventListener('click', () => this.toggleTechOverlay());
    if (this.barBtnSpecs) this.barBtnSpecs.addEventListener('click', () => this.toggleTechOverlay());

    // Lighting Buttons
    const cycleLighting = () => {
      this.lightingMode = (this.lightingMode + 1) % 3;
      if (window.gameInstance) {
        if (this.lightingMode === 0) {
          // Night Neon
          window.gameInstance.scene.background = new THREE.Color(0x0a0f1d);
          window.gameInstance.scene.fog.color = new THREE.Color(0x0a0f1d);
          if (window.gameInstance.sunLight) window.gameInstance.sunLight.color.setHex(0x38bdf8);
          if (this.lightingLabel) this.lightingLabel.textContent = "NIGHT NEON";
        } else if (this.lightingMode === 1) {
          // Sunset Golden Hour
          window.gameInstance.scene.background = new THREE.Color(0x311b92);
          window.gameInstance.scene.fog.color = new THREE.Color(0x311b92);
          if (window.gameInstance.sunLight) window.gameInstance.sunLight.color.setHex(0xff9800);
          if (this.lightingLabel) this.lightingLabel.textContent = "SUNSET GOLD";
        } else {
          // Daylight
          window.gameInstance.scene.background = new THREE.Color(0x38bdf8);
          window.gameInstance.scene.fog.color = new THREE.Color(0x38bdf8);
          if (window.gameInstance.sunLight) window.gameInstance.sunLight.color.setHex(0xffffff);
          if (this.lightingLabel) this.lightingLabel.textContent = "DAYLIGHT";
        }
      }
    };

    if (this.btnNavLighting) this.btnNavLighting.addEventListener('click', cycleLighting);
    if (this.barBtnLight) this.barBtnLight.addEventListener('click', cycleLighting);

    // Fullscreen Toggle
    if (this.btnNavFullscreen) {
      this.btnNavFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        } else {
          document.exitFullscreen().catch(() => { });
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (this.clickPrompt && this.clickPrompt.classList.contains('active')) {
        if (['Space', 'Enter'].includes(e.code)) {
          dismissStart(e);
        }
      } else if (e.code === 'KeyH') {
        this.toggleTechOverlay();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
    });
  }

  resetPlayerOrCar() {
    if (window.gameInstance) {
      if (window.gameInstance.isDrivingVehicle && window.gameInstance.vehicle) {
        window.gameInstance.vehicle.mesh.position.set(0, 0.4, 14);
        window.gameInstance.vehicle.rotationY = 0;
        window.gameInstance.vehicle.speed = 0;
      } else if (window.gameInstance.player) {
        window.gameInstance.player.resetPosition();
      }
      this.resumeGame();
    }
  }

  hideStartPrompt() {
    if (this.clickPrompt) {
      this.clickPrompt.classList.remove('active');
      this.clickPrompt.style.display = 'none';
      this.clickPrompt.style.pointerEvents = 'none';
    }
  }

  toggleTechOverlay() {
    this.isTechOpen = !this.isTechOpen;
    if (this.techModal) {
      if (this.isTechOpen) {
        this.techModal.style.display = 'flex';
        this.techModal.classList.add('active');
        document.exitPointerLock?.();
      } else {
        this.techModal.classList.remove('active');
        this.techModal.style.display = 'none';
        if (window.gameInstance) {
          window.gameInstance.requestPointerLock();
        }
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.pauseModal) {
      if (this.isPaused) {
        this.pauseModal.style.display = 'flex';
        this.pauseModal.classList.add('active');
        document.exitPointerLock?.();
      } else {
        this.pauseModal.classList.remove('active');
        this.pauseModal.style.display = 'none';
        if (window.gameInstance) {
          window.gameInstance.requestPointerLock();
        }
      }
    }
  }

  resumeGame() {
    this.isPaused = false;
    if (this.pauseModal) {
      this.pauseModal.classList.remove('active');
      this.pauseModal.style.display = 'none';
      if (window.gameInstance) {
        window.gameInstance.requestPointerLock();
      }
    }
  }

  updatePlayerHUD(health, maxHealth, stamina, maxStamina, cash) {
    if (this.healthBar) {
      const hpPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
      this.healthBar.style.width = `${hpPct}%`;
    }
    if (this.staminaBar) {
      const stPct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
      this.staminaBar.style.width = `${stPct}%`;
    }
    if (this.cashVal && cash !== undefined) {
      this.cashVal.textContent = `$${cash}`;
    }
  }

  showInteractionPrompt(text) {
    if (this.interactPrompt && this.interactText) {
      this.interactText.textContent = text;
      this.interactPrompt.style.display = 'flex';
    }
  }

  hideInteractionPrompt() {
    if (this.interactPrompt) {
      this.interactPrompt.style.display = 'none';
    }
  }

  updateSpeedometer(speedKmh, show = true) {
    if (this.speedometerCard && this.speedVal) {
      if (show) {
        this.speedometerCard.style.display = 'flex';
        this.speedVal.textContent = `${Math.round(Math.abs(speedKmh))}`;
      } else {
        this.speedometerCard.style.display = 'none';
      }
    }
  }

  setObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.textContent = text;
    }
  }

  renderMinimap(playerPos, playerYaw, cityBuildings, roads, vehiclePos) {
    if (!this.minimapCtx) return;
    this.minimapFrameCount = (this.minimapFrameCount || 0) + 1;
    if (this.minimapFrameCount % 3 !== 0) return;

    const ctx = this.minimapCtx;
    const size = 160;
    const scale = 0.8;

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#0b101d';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-playerYaw);

    // Roads
    ctx.fillStyle = '#1c263c';
    if (roads) {
      roads.forEach(r => {
        const rx = (r.x - playerPos.x) * scale;
        const rz = (r.z - playerPos.z) * scale;
        const rw = r.width * scale;
        const rd = r.depth * scale;
        ctx.fillRect(rx - rw / 2, rz - rd / 2, rw, rd);
      });
    }

    // Buildings
    ctx.fillStyle = '#334155';
    if (cityBuildings) {
      cityBuildings.forEach(b => {
        const bx = (b.x - playerPos.x) * scale;
        const bz = (b.z - playerPos.z) * scale;
        const bw = b.width * scale;
        const bd = b.depth * scale;
        ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd);
      });
    }

    // Vehicle
    if (vehiclePos) {
      const vx = (vehiclePos.x - playerPos.x) * scale;
      const vz = (vehiclePos.z - playerPos.z) * scale;
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(vx - 4, vz - 4, 8, 8);
    }

    ctx.restore();
  }
}

window.UIManager = UIManager;

