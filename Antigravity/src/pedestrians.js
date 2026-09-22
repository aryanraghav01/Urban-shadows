/**
 * Urban Shadows - Realistic Civilian Pedestrian NPC Engine
 */
class PedestrianNPC {
  constructor(scene, x, z, targetNode) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    this.x = x;
    this.y = 0;
    this.z = z;
    this.rotationY = Math.random() * Math.PI * 2;

    this.walkSpeed = 1.6 + Math.random() * 0.8;
    this.targetNode = targetNode;
    this.active = true;

    this.animTime = Math.random() * 10;

    // Realistic civilian apparel color palettes
    this.shirtColors = [
      0x1e293b, 0x0ea5e9, 0xef4444, 0x10b981, 0xd97706, 0x475569, 0xf8fafc, 0x9333ea
    ];
    this.pantsColors = [
      0x0f172a, 0x1e293b, 0x334155, 0x1e1b4b, 0x374151
    ];
    this.skinTones = [
      0xe0a96d, 0xdca26e, 0xc58c58, 0x8d5b4c, 0x52332a, 0xf5cda7
    ];

    this.buildModel();
    this.mesh.position.set(this.x, this.y, this.z);
    this.scene.add(this.mesh);
  }

  buildModel() {
    const shirtColor = this.shirtColors[Math.floor(Math.random() * this.shirtColors.length)];
    const pantsColor = this.pantsColors[Math.floor(Math.random() * this.pantsColors.length)];
    const skinColor = this.skinTones[Math.floor(Math.random() * this.skinTones.length)];

    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.55 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.4 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x181825, roughness: 0.5 });

    // Hips/Root Joint
    this.root = new THREE.Group();
    this.root.position.y = 0.9;
    this.mesh.add(this.root);

    // Torso (Shirt / Jacket)
    const torsoGeo = new THREE.BoxGeometry(0.56, 0.68, 0.3);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 0.34;
    this.root.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.92;
    this.root.add(this.head);

    // Hair / Cap Accent
    const hairGeo = new THREE.BoxGeometry(0.34, 0.12, 0.34);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.08;
    this.root.add(hair);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.58, 0.15);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.38, 0.34, 0);
    this.rightArm.position.set(0.38, 0.34, 0);
    this.root.add(this.leftArm);
    this.root.add(this.rightArm);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.62;
    rightHand.position.y = -0.62;
    this.leftArm.add(leftHand);
    this.rightArm.add(rightHand);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.19, 0.68, 0.19);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.16, -0.34, 0);
    this.rightLeg.position.set(0.16, -0.34, 0);
    this.root.add(this.leftLeg);
    this.root.add(this.rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.12, 0.28);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.68, 0.04);
    rightShoe.position.set(0, -0.68, 0.04);
    this.leftLeg.add(leftShoe);
    this.rightLeg.add(rightShoe);
  }

  update(dt, sidewalkNodes, playerPos, playerVehicle) {
    if (!this.active || !this.targetNode) return;

    let speedMult = 1.0;
    let evadeX = 0;
    let evadeZ = 0;

    // Check vehicle proximity for Evasion Reaction (stepping aside)
    if (playerVehicle && playerVehicle.isOccupied) {
      const vDist = Math.hypot(playerVehicle.x - this.x, playerVehicle.z - this.z);
      if (vDist < 4.5) {
        const angleAway = Math.atan2(this.x - playerVehicle.x, this.z - playerVehicle.z);
        evadeX = Math.sin(angleAway) * 2.5;
        evadeZ = Math.cos(angleAway) * 2.5;
        speedMult = 1.6;
      }
    }

    const dx = (this.targetNode.x + evadeX) - this.x;
    const dz = (this.targetNode.z + evadeZ) - this.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 1.5) {
      const nextIds = this.targetNode.next;
      const nextId = nextIds[Math.floor(Math.random() * nextIds.length)];
      this.targetNode = sidewalkNodes.find(n => n.id === nextId) || this.targetNode;
    }

    const targetAngle = Math.atan2(dx, dz);
    let diffAngle = targetAngle - this.rotationY;

    while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
    while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;

    this.rotationY += diffAngle * 5.0 * dt;

    const currentWalkSpeed = this.walkSpeed * speedMult;
    this.x += Math.sin(this.rotationY) * currentWalkSpeed * dt;
    this.z += Math.cos(this.rotationY) * currentWalkSpeed * dt;

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.y = this.rotationY;

    // Smooth Walking Limb Animation
    this.animTime += dt * currentWalkSpeed * 4.2;
    const legSwing = Math.sin(this.animTime) * 0.58;
    const armSwing = Math.cos(this.animTime) * 0.48;

    this.leftLeg.rotation.x = legSwing;
    this.rightLeg.rotation.x = -legSwing;
    this.leftArm.rotation.x = -armSwing;
    this.rightArm.rotation.x = armSwing;
    this.root.position.y = 0.9 + Math.abs(Math.sin(this.animTime * 2)) * 0.03;
  }

  destroy() {
    this.active = false;
    this.scene.remove(this.mesh);
  }
}

class PedestrianManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.pedestrians = [];
    this.maxPedestrians = 12;
    this.spawnRadius = 60;
    this.despawnRadius = 80;
  }

  update(dt, playerPos, playerVehicle) {
    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const p = this.pedestrians[i];
      const distToPlayer = Math.hypot(p.x - playerPos.x, p.z - playerPos.z);

      if (distToPlayer > this.despawnRadius) {
        p.destroy();
        this.pedestrians.splice(i, 1);
      } else {
        p.update(dt, this.world.sidewalkNodes, playerPos, playerVehicle);
      }
    }

    if (this.pedestrians.length < this.maxPedestrians) {
      this.spawnPedestrian(playerPos);
    }
  }

  spawnPedestrian(playerPos) {
    const nodes = this.world.sidewalkNodes;
    if (!nodes || nodes.length === 0) return;

    const candidateNodes = nodes.filter(n => {
      const dist = Math.hypot(n.x - playerPos.x, n.z - playerPos.z);
      return dist > 15 && dist < this.spawnRadius;
    });

    if (candidateNodes.length === 0) return;

    const startNode = candidateNodes[Math.floor(Math.random() * candidateNodes.length)];
    const nextIds = startNode.next;
    const nextNode = nodes.find(n => n.id === nextIds[0]) || startNode;

    const ped = new PedestrianNPC(this.scene, startNode.x, startNode.z, nextNode);
    this.pedestrians.push(ped);
  }
}

window.PedestrianNPC = PedestrianNPC;
window.PedestrianManager = PedestrianManager;
