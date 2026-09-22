/**
 * Urban Shadows - Realistic AI Civilian Traffic Vehicle Engine
 */
class TrafficVehicle {
  constructor(scene, typeIndex, x, z, targetNode) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.typeIndex = typeIndex;

    this.x = x;
    this.y = 0.42;
    this.z = z;
    this.rotationY = 0;

    this.speed = 0;
    this.targetSpeed = 11.0 + Math.random() * 4.0;
    this.acceleration = 9.0;
    this.deceleration = 15.0;
    this.steerAngle = 0;
    this.radius = 1.35;

    this.targetNode = targetNode;
    this.active = true;

    // Realistic vehicle paint colors
    this.colors = [
      0x0ea5e9, 0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x64748b, 0xf8fafc, 0x1e293b, 0x090d16
    ];

    this.buildModel();
    this.mesh.position.set(this.x, this.y, this.z);
    this.scene.add(this.mesh);
  }

  buildModel() {
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.2 });
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.85 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x330000,
      roughness: 0.3
    });

    let bodyWidth = 2.0, bodyLength = 4.2, cabinLength = 2.3, cabinHeight = 0.65;
    if (this.typeIndex === 1) { // SUV
      bodyWidth = 2.15; bodyLength = 4.5; cabinLength = 2.7; cabinHeight = 0.85;
    } else if (this.typeIndex === 2) { // Hatchback / Compact
      bodyWidth = 1.85; bodyLength = 3.6; cabinLength = 2.1; cabinHeight = 0.62;
    } else if (this.typeIndex === 3) { // Coupe
      bodyWidth = 2.0; bodyLength = 4.3; cabinLength = 2.0; cabinHeight = 0.52;
    }

    // Chassis
    const bodyGeo = new THREE.BoxGeometry(bodyWidth, 0.7, bodyLength);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.35;
    this.mesh.add(body);

    // Glass Cabin
    const cabinGeo = new THREE.BoxGeometry(bodyWidth * 0.88, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.35 + cabinHeight / 2 + 0.15, -0.1);
    this.mesh.add(cabin);

    // LED Headlights
    const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), lightMat);
    const head2 = head1.clone();
    head1.position.set(-bodyWidth * 0.35, 0.42, bodyLength / 2 + 0.01);
    head2.position.set(bodyWidth * 0.35, 0.42, bodyLength / 2 + 0.01);
    this.mesh.add(head1);
    this.mesh.add(head2);

    // Taillights / Brake lights
    const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), this.tailMat);
    const tail2 = tail1.clone();
    tail1.position.set(-bodyWidth * 0.35, 0.42, -bodyLength / 2 - 0.01);
    tail2.position.set(bodyWidth * 0.35, 0.42, -bodyLength / 2 - 0.01);
    this.mesh.add(tail1);
    this.mesh.add(tail2);

    // Tires & Chrome Rims
    this.wheels = [];
    const wheelPositions = [
      { x: -bodyWidth / 2 - 0.05, y: 0.32, z: bodyLength * 0.3, isFront: true },
      { x: bodyWidth / 2 + 0.05, y: 0.32, z: bodyLength * 0.3, isFront: true },
      { x: -bodyWidth / 2 - 0.05, y: 0.32, z: -bodyLength * 0.3, isFront: false },
      { x: bodyWidth / 2 + 0.05, y: 0.32, z: -bodyLength * 0.3, isFront: false }
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8);
    rimGeo.rotateZ(Math.PI / 2);

    for (let pos of wheelPositions) {
      const wGroup = new THREE.Group();
      wGroup.position.set(pos.x, pos.y, pos.z);
      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wGroup.add(tire);
      wGroup.add(rim);
      this.mesh.add(wGroup);
      this.wheels.push({ group: wGroup, isFront: pos.isFront });
    }
  }

  update(dt, world, otherVehicles, playerVehicle) {
    if (!this.active || !this.targetNode) return;

    const dx = this.targetNode.x - this.x;
    const dz = this.targetNode.z - this.z;
    const distToNode = Math.hypot(dx, dz);

    if (distToNode < 3.5) {
      const nextIds = this.targetNode.next;
      const nextId = nextIds[Math.floor(Math.random() * nextIds.length)];
      this.targetNode = world.roadNodes.find(n => n.id === nextId) || world.roadNodes[0];
    }

    const targetAngle = Math.atan2(dx, dz);
    let diffAngle = targetAngle - this.rotationY;

    while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
    while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;

    // Smooth Steering Interpolation for Natural Cornering
    this.rotationY += diffAngle * 3.5 * dt;
    this.steerAngle = THREE.MathUtils.clamp(diffAngle * 0.45, -0.42, 0.42);

    let desiredSpeed = this.targetSpeed;

    // Traffic Light Stop Check across ALL City Intersections
    if (world && world.trafficLightState === 'RED') {
      const step = (world.blockSize || 52) + (world.roadWidth || 18);
      const halfSize = (world.citySize || 420) / 2;

      for (let rx = -halfSize + 20; rx <= halfSize - 20; rx += step) {
        for (let rz = -halfSize + 20; rz <= halfSize - 20; rz += step) {
          const distToIntersection = Math.hypot(rx - this.x, rz - this.z);

          if (distToIntersection > 4.0 && distToIntersection < 22.0) {
            const toInterX = (rx - this.x) / distToIntersection;
            const toInterZ = (rz - this.z) / distToIntersection;
            const forwardDot = toInterX * Math.sin(this.rotationY) + toInterZ * Math.cos(this.rotationY);

            if (forwardDot > 0.4) {
              desiredSpeed = 0;
              break;
            }
          }
        }
        if (desiredSpeed === 0) break;
      }
    }

    // Proactive Smooth Distance Keeping (Prevents Bumping & Accidents)
    for (let v of otherVehicles) {
      if (v === this || !v.active) continue;
      const vdx = v.x - this.x;
      const vdz = v.z - this.z;
      const gap = Math.hypot(vdx, vdz);

      const forwardDot = (vdx * Math.sin(this.rotationY) + vdz * Math.cos(this.rotationY)) / (gap || 1);

      // If a vehicle is in front in the same lane, smoothly slow down to maintain safe distance
      if (gap < 12.0 && forwardDot > 0.5) {
        const speedScale = Math.max(0, (gap - 5.5) / 6.5);
        desiredSpeed = Math.min(desiredSpeed, v.speed * speedScale);
        if (gap < 5.5) desiredSpeed = 0;
      }

      // Gentle separation padding (No crashes, spin-outs or noise)
      if (gap < 4.5) {
        const overlap = 4.5 - gap;
        const pushX = (this.x - v.x) / (gap || 1) * overlap * 0.2;
        const pushZ = (this.z - v.z) / (gap || 1) * overlap * 0.2;
        this.x += pushX;
        this.z += pushZ;
      }
    }

    // Smooth Player Vehicle Contact (Soft Push without Chaotic Crashes)
    if (playerVehicle && playerVehicle.isOccupied) {
      const pdx = playerVehicle.x - this.x;
      const pdz = playerVehicle.z - this.z;
      const pGap = Math.hypot(pdx, pdz);

      if (pGap < 4.5) {
        const pOverlap = 4.5 - pGap;
        const pPushX = (this.x - playerVehicle.x) / (pGap || 1) * pOverlap * 0.4;
        const pPushZ = (this.z - playerVehicle.z) / (pGap || 1) * pOverlap * 0.4;

        this.x += pPushX;
        this.z += pPushZ;
        this.speed = Math.max(0, this.speed - 4.0 * dt);
      }
    }

    if (this.speed < desiredSpeed) {
      this.speed = Math.min(desiredSpeed, this.speed + this.acceleration * dt);
      this.tailMat.emissive.setHex(0x330000);
    } else {
      this.speed = Math.max(desiredSpeed, this.speed - this.deceleration * dt);
      this.tailMat.emissive.setHex(0xff0000);
    }

    const nextX = this.x + Math.sin(this.rotationY) * this.speed * dt;
    const nextZ = this.z + Math.cos(this.rotationY) * this.speed * dt;

    // Building & Solid Object Collision Guard
    let hitBuilding = false;
    const allColliders = [];
    if (world.colliders) allColliders.push(...world.colliders);
    if (world.buildings) allColliders.push(...world.buildings);

    for (let b of allColliders) {
      let minX, maxX, minZ, maxZ;
      if (b.isBox3) {
        minX = b.min.x; maxX = b.max.x; minZ = b.min.z; maxZ = b.max.z;
      } else if (b.minX !== undefined) {
        minX = b.minX; maxX = b.maxX; minZ = b.minZ; maxZ = b.maxZ;
      } else {
        continue;
      }

      const margin = 1.3;
      if (
        nextX >= minX - margin &&
        nextX <= maxX + margin &&
        nextZ >= minZ - margin &&
        nextZ <= maxZ + margin
      ) {
        hitBuilding = true;
        break;
      }
    }

    if (!hitBuilding) {
      this.x = nextX;
      this.z = nextZ;
    } else {
      this.speed = 0;
    }

    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.y = this.rotationY;

    // Spinning Wheels
    const rotDelta = (this.speed / 0.35) * dt;
    for (let w of this.wheels) {
      w.group.children[0].rotation.x += rotDelta;
      w.group.children[1].rotation.x += rotDelta;
      if (w.isFront) {
        w.group.rotation.y = this.steerAngle;
      }
    }
  }

  destroy() {
    this.active = false;
    this.scene.remove(this.mesh);
  }
}

class TrafficManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.vehicles = [];
    this.maxVehicles = 24;
    this.spawnRadius = 110;
    this.despawnRadius = 145;

    // Immediately populate traffic on nearby roads when city boots
    this.initTraffic();
  }

  initTraffic() {
    const nodes = this.world.roadNodes;
    if (!nodes || nodes.length === 0) return;

    for (let i = 0; i < 20; i++) {
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      if (!node || !node.next || node.next.length === 0) continue;

      const isOccupied = this.vehicles.some(v => Math.hypot(v.x - node.x, v.z - node.z) < 8.0);
      if (isOccupied) continue;

      const nextNode = nodes.find(n => n.id === node.next[0]) || node;
      const typeIndex = Math.floor(Math.random() * 4);
      const vehicle = new TrafficVehicle(this.scene, typeIndex, node.x, node.z, nextNode);
      this.vehicles.push(vehicle);
    }
  }

  update(dt, playerPos, playerVehicle) {
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      const distToPlayer = Math.hypot(v.x - playerPos.x, v.z - playerPos.z);

      if (distToPlayer > this.despawnRadius) {
        v.destroy();
        this.vehicles.splice(i, 1);
      } else {
        v.update(dt, this.world, this.vehicles, playerVehicle);
      }
    }

    if (this.vehicles.length < this.maxVehicles) {
      this.spawnTrafficVehicle(playerPos);
    }
  }

  spawnTrafficVehicle(playerPos) {
    const nodes = this.world.roadNodes;
    if (!nodes || nodes.length === 0) return;

    const candidateNodes = nodes.filter(n => {
      const dist = Math.hypot(n.x - playerPos.x, n.z - playerPos.z);
      if (dist <= 12 || dist >= this.spawnRadius) return false;

      // Verify node is NOT inside any building or collider
      if (this.world.colliders) {
        const isInside = this.world.colliders.some(b => {
          if (b.isBox3) {
            return n.x >= b.min.x - 2.0 && n.x <= b.max.x + 2.0 &&
              n.z >= b.min.z - 2.0 && n.z <= b.max.z + 2.0;
          }
          return false;
        });
        if (isInside) return false;
      }
      return true;
    });

    if (candidateNodes.length === 0) return;

    const startNode = candidateNodes[Math.floor(Math.random() * candidateNodes.length)];
    const nextIds = startNode.next;
    if (!nextIds || nextIds.length === 0) return;
    const nextNode = nodes.find(n => n.id === nextIds[0]) || startNode;

    const isOccupied = this.vehicles.some(v => Math.hypot(v.x - startNode.x, v.z - startNode.z) < 8.0);
    if (isOccupied) return;

    const typeIndex = Math.floor(Math.random() * 4);
    const vehicle = new TrafficVehicle(this.scene, typeIndex, startNode.x, startNode.z, nextNode);
    this.vehicles.push(vehicle);
  }
}

window.TrafficVehicle = TrafficVehicle;
window.TrafficManager = TrafficManager;
