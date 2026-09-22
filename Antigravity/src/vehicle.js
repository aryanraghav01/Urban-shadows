/**
 * Urban Shadows - Ultra High Detail Sports Vehicle System
 */
class Vehicle {
  constructor(scene, x = 0, z = 14) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Position & Hypercar Physics
    this.x = x;
    this.y = 0.45;
    this.z = z;
    this.rotationY = 0;

    this.speed = 0;
    this.baseMaxSpeed = 58.0; // Normal top speed (~210 km/h)
    this.nosMaxSpeed = 78.0;  // Hyper Nitrous Boost (~280 km/h)
    this.maxSpeed = this.baseMaxSpeed;
    this.maxReverseSpeed = -18.0;
    this.acceleration = 45.0; // Hypercar instant torque
    this.friction = 6.5;
    this.turnSpeed = 3.2;
    this.steerAngle = 0;

    this.suspensionPitch = 0;
    this.suspensionRoll = 0;
    this.isOccupied = false;
    this.isNosActive = false;

    // Hypercar Metallic & Carbon Fiber Materials
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.96,
      roughness: 0.08
    });

    this.carbonMat = new THREE.MeshStandardMaterial({
      color: 0x0c1322,
      metalness: 0.88,
      roughness: 0.2
    });

    this.cabinMat = new THREE.MeshStandardMaterial({
      color: 0x060913,
      metalness: 0.98,
      roughness: 0.03,
      transparent: true,
      opacity: 0.92
    });

    this.wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.85
    });

    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.95,
      roughness: 0.12
    });

    this.caliperMat = new THREE.MeshBasicMaterial({ color: 0xff2a5f });
    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff2a5f,
      emissive: 0x660000,
      roughness: 0.2
    });

    this.nosFlameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });

    this.underglowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85
    });

    this.buildCarMesh();
    this.mesh.position.set(this.x, this.y, this.z);
    this.scene.add(this.mesh);
  }

  buildCarMesh() {
    this.bodyGroup = new THREE.Group();
    this.mesh.add(this.bodyGroup);

    // Aerodynamic Low-Slung Hypercar Body Chassis
    const bodyGeo = new THREE.BoxGeometry(2.25, 0.62, 4.7);
    const body = new THREE.Mesh(bodyGeo, this.bodyMat);
    body.position.y = 0.34;
    this.bodyGroup.add(body);

    // Carbon Fiber Front Splitter & Bumper
    const splitterGeo = new THREE.BoxGeometry(2.35, 0.12, 0.7);
    const splitter = new THREE.Mesh(splitterGeo, this.carbonMat);
    splitter.position.set(0, 0.12, 2.25);
    this.bodyGroup.add(splitter);

    // Widebody Side Skirts
    const skirtGeo = new THREE.BoxGeometry(2.38, 0.14, 3.8);
    const skirts = new THREE.Mesh(skirtGeo, this.carbonMat);
    skirts.position.set(0, 0.14, 0);
    this.bodyGroup.add(skirts);

    // Dual Roof Engine Intake Scoops
    const scoopGeo = new THREE.BoxGeometry(0.95, 0.15, 1.4);
    const scoop = new THREE.Mesh(scoopGeo, this.carbonMat);
    scoop.position.set(0, 0.72, 1.0);
    this.bodyGroup.add(scoop);

    // Aerodynamic Glass Cockpit Cabin
    const cabinGeo = new THREE.BoxGeometry(1.72, 0.64, 2.5);
    const cabin = new THREE.Mesh(cabinGeo, this.cabinMat);
    cabin.position.set(0, 0.96, -0.2);
    this.bodyGroup.add(cabin);

    // High Downforce Carbon Fiber GT Rear Wing
    const wingSupportGeo = new THREE.BoxGeometry(0.12, 0.52, 0.35);
    const wingSuppL = new THREE.Mesh(wingSupportGeo, this.carbonMat);
    const wingSuppR = wingSuppL.clone();
    wingSuppL.position.set(-0.75, 0.88, -2.2);
    wingSuppR.position.set(0.75, 0.88, -2.2);
    this.bodyGroup.add(wingSuppL);
    this.bodyGroup.add(wingSuppR);

    const spoilerGeo = new THREE.BoxGeometry(2.4, 0.09, 0.55);
    const spoiler = new THREE.Mesh(spoilerGeo, this.carbonMat);
    spoiler.position.set(0, 1.15, -2.2);
    this.bodyGroup.add(spoiler);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.35, 0.12, 0.18);
    const mirrorL = new THREE.Mesh(mirrorGeo, this.carbonMat);
    const mirrorR = mirrorL.clone();
    mirrorL.position.set(-1.22, 0.82, 0.45);
    mirrorR.position.set(1.22, 0.82, 0.45);
    this.bodyGroup.add(mirrorL);
    this.bodyGroup.add(mirrorR);

    // Quad Rear Titanium Exhaust Tailpipes
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 10);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 });

    const exPositions = [-0.65, -0.25, 0.25, 0.65];
    this.nosFlames = [];

    exPositions.forEach(px => {
      const ex = new THREE.Mesh(exhaustGeo, exhaustMat);
      ex.position.set(px, 0.22, -2.38);
      this.bodyGroup.add(ex);

      // NOS Blue Exhaust Flame Cone
      const flameGeo = new THREE.ConeGeometry(0.1, 0.6, 8);
      flameGeo.rotateX(-Math.PI / 2);
      const flame = new THREE.Mesh(flameGeo, this.nosFlameMat);
      flame.position.set(px, 0.22, -2.75);
      flame.visible = false;
      this.bodyGroup.add(flame);
      this.nosFlames.push(flame);
    });

    // Quad Projector LED Headlights
    const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.1), this.headlightMat);
    const head2 = head1.clone();
    head1.position.set(-0.8, 0.42, 2.36);
    head2.position.set(0.8, 0.42, 2.36);
    this.bodyGroup.add(head1);
    this.bodyGroup.add(head2);

    // Spotlight Beams
    this.headSpot1 = new THREE.SpotLight(0xfffaed, 2.5, 40, Math.PI / 6, 0.4);
    this.headSpot1.position.set(-0.8, 0.42, 2.35);
    this.headSpot1.target.position.set(-0.8, 0.2, 20);
    this.bodyGroup.add(this.headSpot1);
    this.bodyGroup.add(this.headSpot1.target);

    this.headSpot2 = new THREE.SpotLight(0xfffaed, 2.5, 40, Math.PI / 6, 0.4);
    this.headSpot2.position.set(0.8, 0.42, 2.35);
    this.headSpot2.target.position.set(0.8, 0.2, 20);
    this.bodyGroup.add(this.headSpot2);
    this.bodyGroup.add(this.headSpot2.target);

    // Full-width Red LED Tail Lightbar
    this.tail1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.1), this.taillightMat);
    this.tail1.position.set(0, 0.42, -2.36);
    this.bodyGroup.add(this.tail1);

    // Neon Chassis Underglow Plane
    const glowGeo = new THREE.PlaneGeometry(2.2, 4.4);
    const glowPlane = new THREE.Mesh(glowGeo, this.underglowMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.05;
    this.mesh.add(glowPlane);

    // Supercar Alloy Wheels & Disc Calipers
    this.wheels = [];
    const wheelPositions = [
      { x: -1.18, y: 0.35, z: 1.55, isFront: true },
      { x: 1.18, y: 0.35, z: 1.55, isFront: true },
      { x: -1.18, y: 0.35, z: -1.55, isFront: false },
      { x: 1.18, y: 0.35, z: -1.55, isFront: false }
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 18);
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.33, 10);
    rimGeo.rotateZ(Math.PI / 2);

    const caliperGeo = new THREE.BoxGeometry(0.1, 0.2, 0.14);

    for (let pos of wheelPositions) {
      const wGroup = new THREE.Group();
      wGroup.position.set(pos.x, pos.y, pos.z);

      const tire = new THREE.Mesh(wheelGeo, this.wheelMat);
      const rim = new THREE.Mesh(rimGeo, this.rimMat);
      const caliper = new THREE.Mesh(caliperGeo, this.caliperMat);
      caliper.position.set(0, 0.08, 0);

      wGroup.add(tire);
      wGroup.add(rim);
      wGroup.add(caliper);

      this.mesh.add(wGroup);
      this.wheels.push({ group: wGroup, isFront: pos.isFront });
    }
  }

  getProximity(playerPos) {
    return Math.hypot(this.x - playerPos.x, this.z - playerPos.z);
  }

  update(dt, inputState, colliders1, colliders2, audio) {
    const prevSpeed = this.speed;

    if (this.isOccupied) {
      // Nitrous Boost Check (Shift key)
      this.isNosActive = inputState.sprint && inputState.forward;
      this.maxSpeed = this.isNosActive ? this.nosMaxSpeed : this.baseMaxSpeed;

      const currentAccel = this.isNosActive ? this.acceleration * 1.5 : this.acceleration;

      if (inputState.forward) {
        this.speed += currentAccel * dt;
      } else if (inputState.backward) {
        this.speed -= this.acceleration * dt;
      } else {
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - this.friction * dt);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + this.friction * dt);
        }
      }

      this.speed = THREE.MathUtils.clamp(this.speed, this.maxReverseSpeed, this.maxSpeed);

      if (Math.abs(this.speed) > 0.2) {
        const dirFactor = this.speed > 0 ? 1 : -1;
        if (inputState.left) {
          this.rotationY += this.turnSpeed * dirFactor * dt;
          this.steerAngle = 0.42;
        } else if (inputState.right) {
          this.rotationY -= this.turnSpeed * dirFactor * dt;
          this.steerAngle = -0.42;
        } else {
          this.steerAngle = 0;
        }
      } else {
        this.steerAngle = 0;
      }
    } else {
      this.isNosActive = false;
      this.maxSpeed = this.baseMaxSpeed;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction * 2 * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction * 2 * dt);
      }
    }

    // Toggle NOS Blue Exhaust Flames
    if (this.nosFlames) {
      this.nosFlames.forEach(flame => {
        flame.visible = this.isNosActive;
        if (this.isNosActive) {
          flame.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.5, 1 + Math.random() * 0.3);
        }
      });
    }

    // Suspension Body Roll & Pitch
    const accelRate = (this.speed - prevSpeed) / dt;
    const targetPitch = THREE.MathUtils.clamp(-accelRate * 0.003, -0.06, 0.04);
    const targetRoll = -this.steerAngle * 0.12 * (Math.abs(this.speed) / this.maxSpeed);

    this.suspensionPitch += (targetPitch - this.suspensionPitch) * 8 * dt;
    this.suspensionRoll += (targetRoll - this.suspensionRoll) * 8 * dt;

    this.bodyGroup.rotation.x = this.suspensionPitch;
    this.bodyGroup.rotation.z = this.suspensionRoll;

    // Brake Light Emission
    if (accelRate < -4.0 || (inputState && inputState.backward && this.speed > 0)) {
      this.taillightMat.emissive.setHex(0xff0000);
    } else {
      this.taillightMat.emissive.setHex(0x550000);
    }

    const moveZ = Math.cos(this.rotationY) * this.speed * dt;
    const moveX = Math.sin(this.rotationY) * this.speed * dt;

    const nextX = this.x + moveX;
    const nextZ = this.z + moveZ;

    // Strict Building & Wall Collision Detection (Prevents clip inside buildings)
    let collision = false;
    const carHalfW = 1.25;
    const carHalfL = 2.45;

    // Combine all scene colliders (Buildings, Perimeter Walls, Props)
    const allColliders = [];
    if (Array.isArray(colliders1)) allColliders.push(...colliders1);
    if (Array.isArray(colliders2)) allColliders.push(...colliders2);

    for (let b of allColliders) {
      let minX, maxX, minZ, maxZ;
      if (b.isBox3) {
        minX = b.min.x; maxX = b.max.x; minZ = b.min.z; maxZ = b.max.z;
      } else if (b.minX !== undefined) {
        minX = b.minX; maxX = b.maxX; minZ = b.minZ; maxZ = b.maxZ;
      } else {
        continue;
      }

      // Check 5 Key Points on the Vehicle Frame
      const sinRot = Math.sin(this.rotationY);
      const cosRot = Math.cos(this.rotationY);

      const checkPoints = [
        { x: nextX, z: nextZ }, // Center
        { x: nextX + sinRot * carHalfL, z: nextZ + cosRot * carHalfL }, // Front Center
        { x: nextX + sinRot * carHalfL - cosRot * carHalfW, z: nextZ + cosRot * carHalfL + sinRot * carHalfW }, // Front Left
        { x: nextX + sinRot * carHalfL + cosRot * carHalfW, z: nextZ + cosRot * carHalfL - sinRot * carHalfW }, // Front Right
        { x: nextX - sinRot * carHalfL - cosRot * carHalfW, z: nextZ - cosRot * carHalfL + sinRot * carHalfW }, // Rear Left
        { x: nextX - sinRot * carHalfL + cosRot * carHalfW, z: nextZ - cosRot * carHalfL - sinRot * carHalfW }  // Rear Right
      ];

      const margin = 0.3;
      for (let pt of checkPoints) {
        if (
          pt.x >= minX - margin &&
          pt.x <= maxX + margin &&
          pt.z >= minZ - margin &&
          pt.z <= maxZ + margin
        ) {
          collision = true;
          break;
        }
      }

      if (collision) break;
    }

    if (!collision) {
      this.x = nextX;
      this.z = nextZ;
    } else {
      if (Math.abs(this.speed) > 5.0 && audio && audio.playImpact) {
        audio.playImpact();
      }
      this.speed = -this.speed * 0.35;
    }

    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;
    this.mesh.rotation.y = this.rotationY;

    // Wheel Spinning & Front Steering Angle
    const wheelRotDelta = (this.speed / 0.38) * dt;
    for (let w of this.wheels) {
      w.group.children[0].rotation.x += wheelRotDelta;
      w.group.children[1].rotation.x += wheelRotDelta;
      if (w.isFront) {
        w.group.rotation.y = this.steerAngle;
      }
    }
  }
}

window.Vehicle = Vehicle;

