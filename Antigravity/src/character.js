/**
 * Urban Shadows - Articulated Realistic Adult 3D Humanoid Character & Animation Engine
 */
class CharacterController {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audio = audioManager;

    // Player stats
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.cash = 500;

    // Locomotion parameters
    this.walkSpeed = 6.5;
    this.runSpeed = 12.5;
    this.crouchSpeed = 3.5;
    this.jumpForce = 9.0;
    this.gravity = 25.0;

    // Locomotion states
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isSprinting = false;
    this.isCrouching = false;
    this.animTime = 0;

    // Vehicle Transition Sequence State
    this.isEnteringVehicle = false;
    this.vehicleTransitionTimer = 0;

    // Input state
    this.input = {
      forward: 0,
      side: 0,
      sprint: false,
      jump: false,
      crouch: false
    };

    // Collision Bounding Box Radius/Height
    this.radius = 0.48;
    this.height = 1.85;
    this.position = new THREE.Vector3(0, 0.925, 0);

    // Footstep timing tracker
    this.footstepTimer = 0;

    this.mesh = this.createRealisticAdultHumanoid();
    this.scene.add(this.mesh);
  }

  createRealisticAdultHumanoid() {
    const group = new THREE.Group();

    // High quality PBR-style materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.25
    });
    const innerShirtMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6
    });
    const jeansMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      roughness: 0.85
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdca26e,
      roughness: 0.55
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.3,
      emissive: 0x006688,
      emissiveIntensity: 0.25
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      roughness: 0.5
    });

    // Root Hip Joint
    this.rootPivot = new THREE.Group();
    this.rootPivot.position.y = 0.925;
    group.add(this.rootPivot);

    // Torso (Jacket Body)
    const torsoGeo = new THREE.BoxGeometry(0.62, 0.72, 0.34);
    this.torso = new THREE.Mesh(torsoGeo, jacketMat);
    this.torso.position.y = 0.36;
    this.torso.castShadow = true;
    this.rootPivot.add(this.torso);

    // Inner Shirt Collar
    const collarGeo = new THREE.BoxGeometry(0.4, 0.16, 0.35);
    const collar = new THREE.Mesh(collarGeo, innerShirtMat);
    collar.position.y = 0.73;
    this.rootPivot.add(collar);

    // Head
    const headGeo = new THREE.BoxGeometry(0.34, 0.34, 0.34);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.96;
    this.head.castShadow = true;
    this.rootPivot.add(this.head);

    // Cap & Visor
    const capGeo = new THREE.BoxGeometry(0.36, 0.12, 0.36);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.13;
    this.rootPivot.add(cap);

    const visorGeo = new THREE.BoxGeometry(0.32, 0.04, 0.18);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 1.09, 0.25);
    this.rootPivot.add(visor);

    // Left Shoulder & Arm Joint
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.42, 0.66, 0);
    this.rootPivot.add(this.leftShoulder);

    const armGeo = new THREE.BoxGeometry(0.17, 0.62, 0.17);
    const leftArmMesh = new THREE.Mesh(armGeo, jacketMat);
    leftArmMesh.position.y = -0.31;
    leftArmMesh.castShadow = true;
    this.leftShoulder.add(leftArmMesh);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.66;
    this.leftShoulder.add(leftHand);

    // Right Shoulder & Arm Joint
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.42, 0.66, 0);
    this.rootPivot.add(this.rightShoulder);

    const rightArmMesh = new THREE.Mesh(armGeo, jacketMat);
    rightArmMesh.position.y = -0.31;
    rightArmMesh.castShadow = true;
    this.rightShoulder.add(rightArmMesh);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.66;
    this.rightShoulder.add(rightHand);

    // Left Hip & Leg Joint
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.18, 0.0, 0);
    this.rootPivot.add(this.leftHip);

    const legGeo = new THREE.BoxGeometry(0.21, 0.72, 0.21);
    const leftLegMesh = new THREE.Mesh(legGeo, jeansMat);
    leftLegMesh.position.y = -0.36;
    leftLegMesh.castShadow = true;
    this.leftHip.add(leftLegMesh);

    // Right Hip & Leg Joint
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.18, 0.0, 0);
    this.rootPivot.add(this.rightHip);

    const rightLegMesh = new THREE.Mesh(legGeo, jeansMat);
    rightLegMesh.position.y = -0.36;
    rightLegMesh.castShadow = true;
    this.rightHip.add(rightLegMesh);

    // Leather Sneakers
    const shoeGeo = new THREE.BoxGeometry(0.23, 0.15, 0.33);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.7, 0.05);
    leftShoe.castShadow = true;
    this.leftHip.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.7, 0.05);
    rightShoe.castShadow = true;
    this.rightHip.add(rightShoe);

    group.position.copy(this.position);
    return group;
  }

  handleInput(inputState) {
    this.input = inputState;
  }

  update(delta, cameraYaw, colliders) {
    if (delta > 0.1) delta = 0.1;

    // Crouch scale lerp
    this.isCrouching = this.input.crouch && this.isGrounded;
    const targetScaleY = this.isCrouching ? 0.65 : 1.0;
    this.mesh.scale.y += (targetScaleY - this.mesh.scale.y) * 10 * delta;

    // Stamina calculation
    const isMoving = (this.input.forward !== 0 || this.input.side !== 0);
    this.isSprinting = this.input.sprint && isMoving && !this.isCrouching && this.stamina > 5;

    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 25 * delta);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * delta);
    }

    let speed = this.walkSpeed;
    if (this.isSprinting) speed = this.runSpeed;
    else if (this.isCrouching) speed = this.crouchSpeed;

    const moveDir = new THREE.Vector3();
    if (isMoving) {
      const moveForward = this.input.forward;
      const moveSide = this.input.side;

      const forwardVec = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
      const rightVec = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

      moveDir.addScaledVector(forwardVec, moveForward);
      moveDir.addScaledVector(rightVec, moveSide);
      moveDir.normalize();

      // Smooth mesh rotation towards target angle
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetAngle - this.mesh.rotation.y;

      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.mesh.rotation.y += diff * 14 * delta;
    }

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    if (this.input.jump && this.isGrounded && !this.isCrouching) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      if (this.audio) this.audio.playJumpSound();
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }

    const moveStep = this.velocity.clone().multiplyScalar(delta);
    this.resolveCollisions(moveStep, colliders);

    this.position.add(moveStep);
    this.mesh.position.copy(this.position);

    // Update Humanoid Pose Animations
    this.animateHumanoid(delta, isMoving, speed);

    // Footstep audio processing
    if (isMoving && this.isGrounded) {
      const stepInterval = this.isSprinting ? 0.26 : 0.42;
      this.footstepTimer += delta;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        if (this.audio) this.audio.playFootstep('asphalt', this.isSprinting);
      }
    } else {
      this.footstepTimer = 0;
    }
  }

  resolveCollisions(moveStep, colliders) {
    const allBoxes = [];
    if (colliders) allBoxes.push(...colliders);

    // Dynamic vehicle boxes (Sports car & traffic cars)
    if (window.gameInstance) {
      if (window.gameInstance.vehicle && !window.gameInstance.isDrivingVehicle) {
        const v = window.gameInstance.vehicle;
        const vBox = new THREE.Box3();
        vBox.setFromCenterAndSize(
          new THREE.Vector3(v.x, v.y, v.z),
          new THREE.Vector3(2.4, 1.4, 4.8)
        );
        allBoxes.push(vBox);
      }

      if (window.gameInstance.traffic && window.gameInstance.traffic.vehicles) {
        for (let tv of window.gameInstance.traffic.vehicles) {
          if (!tv.active) continue;
          const tvBox = new THREE.Box3();
          tvBox.setFromCenterAndSize(
            new THREE.Vector3(tv.x, tv.y, tv.z),
            new THREE.Vector3(2.2, 1.4, 4.4)
          );
          allBoxes.push(tvBox);
        }
      }
    }

    if (allBoxes.length === 0) return;

    // Test X Axis
    const testPosX = this.position.x + moveStep.x;
    let playerBoxX = this.getPlayerAABB(testPosX, this.position.y, this.position.z);

    for (let box of allBoxes) {
      if (playerBoxX.intersectsBox(box)) {
        moveStep.x = 0;
        this.velocity.x = 0;
        break;
      }
    }

    // Test Z Axis
    const testPosZ = this.position.z + moveStep.z;
    let playerBoxZ = this.getPlayerAABB(this.position.x + moveStep.x, this.position.y, testPosZ);

    for (let box of allBoxes) {
      if (playerBoxZ.intersectsBox(box)) {
        moveStep.z = 0;
        this.velocity.z = 0;
        break;
      }
    }

    // Ground Y Axis
    const testPosY = this.position.y + moveStep.y;
    const groundHeight = 0.925;

    if (testPosY <= groundHeight) {
      if (!this.isGrounded && this.velocity.y < -5.0 && this.audio) {
        this.audio.playLandSound();
      }
      moveStep.y = groundHeight - this.position.y;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  getPlayerAABB(x, y, z) {
    const box = new THREE.Box3();
    const currentHeight = this.isCrouching ? this.height * 0.65 : this.height;
    box.setFromCenterAndSize(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(this.radius * 2, currentHeight, this.radius * 2)
    );
    return box;
  }

  animateHumanoid(delta, isMoving, speed) {
    const lerpSpeed = 12 * delta;

    if (isMoving && this.isGrounded) {
      this.animTime += delta * speed * 1.6;
      const strideAngle = Math.sin(this.animTime) * (this.isSprinting ? 0.88 : 0.58);
      const armSwing = Math.cos(this.animTime) * (this.isSprinting ? 0.78 : 0.48);

      this.leftHip.rotation.x = THREE.MathUtils.lerp(this.leftHip.rotation.x, strideAngle, lerpSpeed);
      this.rightHip.rotation.x = THREE.MathUtils.lerp(this.rightHip.rotation.x, -strideAngle, lerpSpeed);
      this.leftShoulder.rotation.x = THREE.MathUtils.lerp(this.leftShoulder.rotation.x, -armSwing, lerpSpeed);
      this.rightShoulder.rotation.x = THREE.MathUtils.lerp(this.rightShoulder.rotation.x, armSwing, lerpSpeed);

      // Torso tilt while sprinting
      const targetTorsoTilt = this.isSprinting ? 0.24 : 0.05;
      this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, targetTorsoTilt, lerpSpeed);
    } else if (!this.isGrounded) {
      // Jump Pose: Legs flared, arms up
      this.leftHip.rotation.x = THREE.MathUtils.lerp(this.leftHip.rotation.x, -0.4, lerpSpeed);
      this.rightHip.rotation.x = THREE.MathUtils.lerp(this.rightHip.rotation.x, 0.4, lerpSpeed);
      this.leftShoulder.rotation.x = THREE.MathUtils.lerp(this.leftShoulder.rotation.x, -0.8, lerpSpeed);
      this.rightShoulder.rotation.x = THREE.MathUtils.lerp(this.rightShoulder.rotation.x, -0.8, lerpSpeed);
    } else {
      // Idle Breathing & Weight Shift
      this.animTime += delta * 2.0;
      const breathingBob = Math.sin(this.animTime) * 0.035;
      const swayRoll = Math.cos(this.animTime * 0.5) * 0.03;

      this.leftHip.rotation.x = THREE.MathUtils.lerp(this.leftHip.rotation.x, 0, lerpSpeed);
      this.rightHip.rotation.x = THREE.MathUtils.lerp(this.rightHip.rotation.x, 0, lerpSpeed);
      this.leftShoulder.rotation.x = THREE.MathUtils.lerp(this.leftShoulder.rotation.x, 0, lerpSpeed);
      this.rightShoulder.rotation.x = THREE.MathUtils.lerp(this.rightShoulder.rotation.x, 0, lerpSpeed);
      this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, 0, lerpSpeed);
      this.torso.rotation.z = THREE.MathUtils.lerp(this.torso.rotation.z, swayRoll, lerpSpeed);
      this.rootPivot.position.y = 0.925 + breathingBob;
    }
  }

  resetPosition() {
    this.position.set(0, 0.925, 0);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
  }
}

window.CharacterController = CharacterController;
