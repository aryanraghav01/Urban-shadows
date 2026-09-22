/**
 * Urban Shadows - Ultra Fast High Performance Game Engine (100+ FPS Smooth 3D Renderer)
 */
class UrbanShadowsGame {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.clock = new THREE.Clock();

    // Input state tracker
    this.keys = {
      W: false, S: false, A: false, D: false,
      Shift: false, Space: false, C: false, E: false
    };

    // Camera orbit parameters (Controlled strictly by mouse)
    this.cameraDistance = 5.2;
    this.targetCameraYaw = 0;
    this.targetCameraPitch = 0.30;
    this.cameraYaw = 0;
    this.cameraPitch = 0.30;

    this.isMouseDown = false;
    this.mouseSensitivity = 0.0020;

    // Vehicle Driving Mode Flag
    this.isDrivingVehicle = false;

    this.initEngine();
    this.initSystems();
    this.initInputListeners();
    this.updateCamera(0.016);
    this.animate();
  }

  initEngine() {
    // Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0025);

    // Perspective 3D Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      450
    );

    // High Quality Crisp 3D Renderer Setup (100+ FPS)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = false;

    // Crisp Ambient & Sunlight Setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3a475d, 1.25);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.sunLight.position.set(60, 100, 50);
    this.scene.add(this.sunLight);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  initSystems() {
    this.audio = new AudioManager();
    this.ui = new UIManager();
    this.world = new World(this.scene);
    this.player = new CharacterController(this.scene, this.audio);
    this.vehicle = new Vehicle(this.scene, 0, 14);

    if (typeof TrafficManager !== 'undefined') {
      this.traffic = new TrafficManager(this.scene, this.world);
    }
    if (typeof PedestrianManager !== 'undefined') {
      this.pedestrians = new PedestrianManager(this.scene, this.world);
    }

    window.gameInstance = this;
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    const onPointerLockTrigger = () => {
      this.isMouseDown = true;
      this.requestPointerLock();
      if (this.audio) this.audio.init();
    };

    this.canvas.addEventListener('click', onPointerLockTrigger);
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.requestPointerLock();
        if (this.audio) this.audio.init();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.lastMouseX = undefined;
      this.lastMouseY = undefined;
    });

    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.canvas || document.pointerLockElement === document.body);
    });
  }

  requestPointerLock() {
    if (!this.isPointerLocked && this.canvas && this.canvas.requestPointerLock) {
      try {
        this.canvas.requestPointerLock();
      } catch (e) { }
    }
  }

  onKeyDown(e) {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.W = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.S = true;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.A = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.D = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.Shift = true;
    if (code === 'Space') this.keys.Space = true;
    if (code === 'KeyC') this.keys.C = !this.keys.C;

    if (code === 'KeyE' || code === 'KeyF') {
      this.toggleVehicleDrive();
    }
  }

  onKeyUp(e) {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.W = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.S = false;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.A = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.D = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.Shift = false;
    if (code === 'Space') this.keys.Space = false;
  }

  onMouseMove(e) {
    if (this.isPointerLocked || this.isMouseDown) {
      let movementX = 0;
      let movementY = 0;

      if (this.isPointerLocked) {
        movementX = THREE.MathUtils.clamp(e.movementX || 0, -35, 35);
        movementY = THREE.MathUtils.clamp(e.movementY || 0, -35, 35);
      } else {
        if (this.lastMouseX !== undefined) {
          movementX = THREE.MathUtils.clamp(e.clientX - this.lastMouseX, -35, 35);
          movementY = THREE.MathUtils.clamp(e.clientY - this.lastMouseY, -35, 35);
        }
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }

      this.targetCameraYaw -= movementX * this.mouseSensitivity;
      this.targetCameraPitch += movementY * this.mouseSensitivity;

      const minPitch = 0.08;
      const maxPitch = 1.15;
      this.targetCameraPitch = THREE.MathUtils.clamp(this.targetCameraPitch, minPitch, maxPitch);
    }
  }

  toggleVehicleDrive() {
    if (this.isDrivingVehicle) {
      // Exit Vehicle
      this.isDrivingVehicle = false;
      this.vehicle.isOccupied = false;
      this.player.mesh.visible = true;

      const sideOffset = new THREE.Vector3(-1.8, 0, 0);
      sideOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.vehicle.rotationY);
      this.player.position.set(
        this.vehicle.x + sideOffset.x,
        0.925,
        this.vehicle.z + sideOffset.z
      );
      this.player.velocity.set(0, 0, 0);
      this.player.mesh.position.copy(this.player.position);

      this.ui.setObjective("Explore the city or press E near a vehicle to drive.");
      this.ui.updateSpeedometer(0, false);
    } else {
      const distance = this.vehicle.getProximity(this.player.position);
      if (distance < 3.8) {
        this.isDrivingVehicle = true;
        this.vehicle.isOccupied = true;
        this.player.mesh.visible = false;
        this.ui.hideInteractionPrompt();
        this.ui.setObjective("Driving Sports Vehicle. Use WASD to steer, Press E to exit.");
      }
    }
  }

  updateCamera(delta) {
    let focusPos = new THREE.Vector3();
    let baseDistance = 5.2;

    // Cinematic 3D Menu Orbit when start menu or tech modal is open
    if (this.ui && (this.ui.clickPrompt?.classList.contains('active') || this.ui.isTechOpen)) {
      this.targetCameraYaw += 0.25 * delta;
    }

    if (this.isDrivingVehicle && this.vehicle) {
      focusPos.set(this.vehicle.x, this.vehicle.y + 1.2, this.vehicle.z);
      baseDistance = 7.0 + (Math.abs(this.vehicle.speed) / this.vehicle.maxSpeed) * 1.8;
    } else if (this.player) {
      focusPos.copy(this.player.position);
      focusPos.y += 1.35;
      baseDistance = 5.2;
    }

    // Speed-based 3D FOV Warp (Cinematic Velocity Feel)
    let targetFov = 60;
    if (this.isDrivingVehicle && this.vehicle) {
      targetFov = 60 + (Math.abs(this.vehicle.speed) / this.vehicle.maxSpeed) * 14;
    } else if (this.keys.Shift && this.player) {
      targetFov = 68;
    }
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * 5 * delta;
      this.camera.updateProjectionMatrix();
    }

    this.cameraDistance = baseDistance;
    this.cameraYaw = this.targetCameraYaw;
    this.cameraPitch = THREE.MathUtils.clamp(this.targetCameraPitch, 0.08, 1.15);

    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    const offset = new THREE.Vector3(
      sinYaw * cosPitch * this.cameraDistance,
      sinPitch * this.cameraDistance,
      cosYaw * cosPitch * this.cameraDistance
    );

    const targetCamPos = focusPos.clone().add(offset);
    this.camera.position.copy(targetCamPos);
    this.camera.lookAt(focusPos);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    try {
      if (!this.ui.isPaused) {
        this.world.update(delta);

        const inputState = {
          forward: this.keys.W,
          backward: this.keys.S,
          left: this.keys.A,
          right: this.keys.D,
          sprint: this.keys.Shift,
          jump: this.keys.Space,
          crouch: this.keys.C
        };

        const activePos = this.isDrivingVehicle ? { x: this.vehicle.x, z: this.vehicle.z } : this.player.position;

        if (this.isDrivingVehicle) {
          this.vehicle.update(delta, inputState, this.world.colliders, this.world.buildings, this.audio);
          this.player.position.set(this.vehicle.x, this.vehicle.y, this.vehicle.z);
          this.player.mesh.position.copy(this.player.position);

          const speedRatio = Math.abs(this.vehicle.speed) / this.vehicle.maxSpeed;
          if (this.audio) this.audio.updateEngineSound(speedRatio, true);

          const speedKmh = speedRatio * 140;
          this.ui.updateSpeedometer(speedKmh, true);
        } else {
          if (this.audio) this.audio.updateEngineSound(0, false);

          const forwardInput = (this.keys.W ? 1 : 0) - (this.keys.S ? 1 : 0);
          const sideInput = (this.keys.D ? 1 : 0) - (this.keys.A ? 1 : 0);

          this.player.handleInput({
            forward: forwardInput,
            side: sideInput,
            sprint: this.keys.Shift,
            jump: this.keys.Space,
            crouch: this.keys.C
          });

          this.player.update(delta, this.cameraYaw, this.world.colliders);

          const distToCar = this.vehicle.getProximity(this.player.position);
          if (distToCar < 3.8) {
            this.ui.showInteractionPrompt("Press E to Drive Vehicle");
          } else {
            this.ui.hideInteractionPrompt();
          }

          this.ui.updateSpeedometer(0, false);
        }

        if (this.traffic) {
          this.traffic.update(delta, activePos, this.vehicle);
        }
        if (this.pedestrians) {
          this.pedestrians.update(delta, activePos, this.vehicle);
        }

        this.updateCamera(delta);

        this.ui.updatePlayerHUD(
          this.player.health,
          this.player.maxHealth,
          this.player.stamina,
          this.player.maxStamina,
          this.player.cash
        );

        this.ui.renderMinimap(
          activePos,
          this.cameraYaw,
          this.world.buildings,
          this.world.roads,
          { x: this.vehicle.x, z: this.vehicle.z }
        );
      }
    } catch (err) {
      console.warn("Frame update warning:", err);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function bootUrbanShadows() {
  if (!window.gameInstance) {
    new UrbanShadowsGame();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootUrbanShadows);
} else {
  bootUrbanShadows();
}
