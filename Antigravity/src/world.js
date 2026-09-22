/**
 * Urban Shadows - City Environment & High-Quality Showcase World Builder
 */
class World {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.colliders = [];
    this.roads = [];
    this.props = [];

    // AI Navigation Grid Nodes
    this.roadNodes = [];
    this.sidewalkNodes = [];
    this.trafficLightState = 'GREEN';
    this.trafficLightTimer = 0;

    this.citySize = 420;
    this.roadWidth = 18;
    this.blockSize = 52;

    this.initTextures();
    this.buildCity();
    this.buildSkybox();
    this.buildNavigationNodes();
  }

  initTextures() {
    // Generate Procedural Realistic Asphalt Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(Math.random() * 30 + 20);
      ctx.fillStyle = `rgb(${gray}, ${gray + 4}, ${gray + 8})`;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let p = 0; p < 6; p++) {
      const px = Math.random() * 400 + 50;
      const py = Math.random() * 400 + 50;
      const pr = Math.random() * 30 + 15;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    this.asphaltTexture = new THREE.CanvasTexture(canvas);
    this.asphaltTexture.wrapS = THREE.RepeatWrapping;
    this.asphaltTexture.wrapT = THREE.RepeatWrapping;
    this.asphaltTexture.repeat.set(24, 24);
  }

  buildSkybox() {
    const skyGeo = new THREE.SphereGeometry(580, 32, 16);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(0.4, '#38bdf8');
    grad.addColorStop(0.7, '#7dd3fc');
    grad.addColorStop(1.0, '#cbd5e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let c = 0; c < 20; c++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 250 + 50;
      const cw = Math.random() * 120 + 60;
      const ch = Math.random() * 25 + 10;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);
  }

  buildCity() {
    this.createGround();
    this.createRoadGrid();
    this.createBlocks();
    this.createStreetProps();
    this.createTrafficLights();
    this.createFoliage();
    this.createPerimeterWalls();
  }

  createGround() {
    const groundGeo = new THREE.PlaneGeometry(this.citySize * 1.5, this.citySize * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.scene.add(ground);
  }

  createRoadGrid() {
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTexture,
      roughness: 0.65,
      metalness: 0.35
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const crosswalkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });

    const step = this.blockSize + this.roadWidth;
    const halfSize = this.citySize / 2;

    for (let x = -halfSize; x <= halfSize; x += step) {
      const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.citySize);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.01, 0);
      this.scene.add(road);

      this.roads.push({ x: x, z: 0, width: this.roadWidth, depth: this.citySize });

      for (let z = -halfSize; z <= halfSize; z += 8) {
        const stripeGeo = new THREE.PlaneGeometry(0.45, 4.5);
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.02, z);
        this.scene.add(stripe);
      }
    }

    for (let z = -halfSize; z <= halfSize; z += step) {
      const roadGeo = new THREE.PlaneGeometry(this.citySize, this.roadWidth);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.01, z);
      this.scene.add(road);

      this.roads.push({ x: 0, z: z, width: this.citySize, depth: this.roadWidth });

      for (let x = -halfSize; x <= halfSize; x += 8) {
        const stripeGeo = new THREE.PlaneGeometry(4.5, 0.45);
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.02, z);
        this.scene.add(stripe);
      }
    }

    for (let x = -halfSize; x <= halfSize; x += step) {
      for (let z = -halfSize; z <= halfSize; z += step) {
        this.createCrosswalk(x, z, crosswalkMat);
      }
    }
  }

  createCrosswalk(x, z, mat) {
    const halfR = this.roadWidth / 2;
    const offsets = [
      { x: 0, z: halfR + 1.5, rot: 0 },
      { x: 0, z: -halfR - 1.5, rot: 0 },
      { x: halfR + 1.5, z: 0, rot: Math.PI / 2 },
      { x: -halfR - 1.5, z: 0, rot: Math.PI / 2 }
    ];

    offsets.forEach(off => {
      const group = new THREE.Group();
      for (let i = -5; i <= 5; i += 1.8) {
        const barGeo = new THREE.PlaneGeometry(0.8, 4);
        const bar = new THREE.Mesh(barGeo, mat);
        bar.rotation.x = -Math.PI / 2;
        bar.position.set(i, 0.025, 0);
        group.add(bar);
      }
      group.position.set(x + off.x, 0, z + off.z);
      group.rotation.y = off.rot;
      this.scene.add(group);
    });
  }

  createBlocks() {
    const step = this.blockSize + this.roadWidth;
    const halfSize = this.citySize / 2 - step / 2;

    const buildingColors = [
      0x1e293b, 0x0f172a, 0x334155, 0x181825, 0x27273a, 0x111827
    ];

    for (let bx = -halfSize; bx <= halfSize; bx += step) {
      for (let bz = -halfSize; bz <= halfSize; bz += step) {
        this.createCityBlock(bx, bz, buildingColors);
      }
    }
  }

  createCityBlock(centerX, centerZ, palette) {
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x3a475d,
      roughness: 0.75,
      metalness: 0.1
    });

    const sidewalkGeo = new THREE.BoxGeometry(this.blockSize, 0.35, this.blockSize);
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.position.set(centerX, 0.175, centerZ);
    this.scene.add(sidewalk);

    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const curbGeo = new THREE.BoxGeometry(this.blockSize + 0.4, 0.15, this.blockSize + 0.4);
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(centerX, 0.075, centerZ);
    this.scene.add(curb);

    const isSkyscraper = Math.random() < 0.35;

    if (isSkyscraper) {
      const height = 45 + Math.random() * 35;
      const width = this.blockSize - 8;
      const depth = this.blockSize - 8;
      this.createDetailedBuilding(centerX, centerZ, width, height, depth, palette[Math.floor(Math.random() * palette.length)]);
    } else {
      const subSize = (this.blockSize - 8) / 2;
      const offsets = [
        { x: -subSize / 2 - 1.5, z: -subSize / 2 - 1.5 },
        { x: subSize / 2 + 1.5, z: -subSize / 2 - 1.5 },
        { x: -subSize / 2 - 1.5, z: subSize / 2 + 1.5 },
        { x: subSize / 2 + 1.5, z: subSize / 2 + 1.5 }
      ];

      offsets.forEach(off => {
        const height = 18 + Math.random() * 26;
        const width = subSize - 1;
        const depth = subSize - 1;
        this.createDetailedBuilding(centerX + off.x, centerZ + off.z, width, height, depth, palette[Math.floor(Math.random() * palette.length)]);
      });
    }
  }

  createDetailedBuilding(x, z, width, height, depth, colorHex) {
    const group = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.5,
      metalness: 0.3
    });
    const mainGeo = new THREE.BoxGeometry(width, height, depth);
    const mainMesh = new THREE.Mesh(mainGeo, wallMat);
    mainMesh.position.y = height / 2;
    group.add(mainMesh);

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffeeaa,
      emissive: 0xffb703,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.4
    });

    const rows = Math.floor(height / 4);
    const cols = Math.floor(width / 3.5);

    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isLit = Math.random() > 0.35;
        const currentWinMat = isLit ? windowMat : glassMat;
        const winGeo = new THREE.PlaneGeometry(1.4, 2.0);

        const winF = new THREE.Mesh(winGeo, currentWinMat);
        winF.position.set(-width / 2 + (c + 0.8) * (width / cols), r * 4, depth / 2 + 0.05);
        group.add(winF);

        const winB = winF.clone();
        winB.position.z = -depth / 2 - 0.05;
        winB.rotation.y = Math.PI;
        group.add(winB);
      }
    }

    // High-Impact Commercial 3D Neon Billboards ("SHADOW TECH", "NEON MOTORS", "METRO BANK")
    if (Math.random() > 0.35) {
      const billboardNames = ["SHADOW TECH", "NEON MOTORS", "METRO BANK", "CYBER CAFE", "URBAN NIGHTS"];
      const billboardColors = [0x00f0ff, 0xff2a5f, 0x00e676, 0xffb703, 0xa855f7];
      const selectedIndex = Math.floor(Math.random() * billboardNames.length);

      const signMat = new THREE.MeshBasicMaterial({ color: billboardColors[selectedIndex] });
      const signGeo = new THREE.BoxGeometry(width * 0.7, 1.6, 0.35);
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 4.0, depth / 2 + 0.22);
      group.add(sign);
    }

    // Roof Structure (Helipad, AC Vents, Antennas)
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const roofVentGeo = new THREE.BoxGeometry(2.8, 2.0, 2.8);
    const roofVent = new THREE.Mesh(roofVentGeo, roofMat);
    roofVent.position.set(0, height + 1.0, 0);
    group.add(roofVent);

    const antGeo = new THREE.CylinderGeometry(0.08, 0.08, 7, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(width / 4, height + 3.5, depth / 4);
    group.add(ant);

    group.position.set(x, 0, z);
    this.scene.add(group);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(x, height / 2, z),
      new THREE.Vector3(width + 0.4, height, depth + 0.4)
    );
    this.colliders.push(box);
    this.buildings.push({ x, z, width, depth, height, minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
  }

  createStreetProps() {
    const step = this.blockSize + this.roadWidth;
    const halfSize = this.citySize / 2;

    const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe8aa });

    for (let x = -halfSize + 20; x <= halfSize - 20; x += 36) {
      for (let z = -halfSize + 20; z <= halfSize - 20; z += 36) {
        const lampGroup = new THREE.Group();

        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.5, 8);
        const pole = new THREE.Mesh(poleGeo, lampMat);
        pole.position.y = 3.25;
        lampGroup.add(pole);

        const fixtureGeo = new THREE.BoxGeometry(0.8, 0.2, 0.4);
        const fixture = new THREE.Mesh(fixtureGeo, lampMat);
        fixture.position.set(0.3, 6.4, 0);
        lampGroup.add(fixture);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
        bulb.position.set(0.3, 6.2, 0);
        lampGroup.add(bulb);

        lampGroup.position.set(x, 0, z);
        this.scene.add(lampGroup);

        const lampBox = new THREE.Box3();
        lampBox.setFromCenterAndSize(new THREE.Vector3(x, 3.25, z), new THREE.Vector3(0.6, 6.5, 0.6));
        this.colliders.push(lampBox);
      }
    }
  }

  createTrafficLights() {
    const step = this.blockSize + this.roadWidth;
    const halfSize = this.citySize / 2 - step / 2;

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    this.lightGreenMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
    this.lightRedMat = new THREE.MeshBasicMaterial({ color: 0xff2a5f });
    this.trafficLightMeshes = [];

    for (let x = -halfSize; x <= halfSize; x += step) {
      for (let z = -halfSize; z <= halfSize; z += step) {
        const group = new THREE.Group();

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.0, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.5;
        group.add(pole);

        // Light Box Housing
        const boxGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const box = new THREE.Mesh(boxGeo, poleMat);
        box.position.set(0, 4.5, 0);
        group.add(box);

        // Signal Lamp Bulbs
        const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const topLight = new THREE.Mesh(bulbGeo, this.lightRedMat);
        topLight.position.set(0, 4.8, 0.21);
        group.add(topLight);

        const botLight = new THREE.Mesh(bulbGeo, this.lightGreenMat);
        botLight.position.set(0, 4.2, 0.21);
        group.add(botLight);

        group.position.set(x + this.roadWidth / 2 - 1, 0, z + this.roadWidth / 2 - 1);
        this.scene.add(group);
        this.trafficLightMeshes.push({ top: topLight, bot: botLight });
      }
    }
  }

  createFoliage() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

    const step = this.blockSize + this.roadWidth;
    const halfSize = this.citySize / 2 - step / 2;

    for (let bx = -halfSize; bx <= halfSize; bx += step) {
      for (let bz = -halfSize; bz <= halfSize; bz += step) {
        const corners = [
          { x: bx + this.blockSize / 2 - 2, z: bz + this.blockSize / 2 - 2 },
          { x: bx - this.blockSize / 2 + 2, z: bz - this.blockSize / 2 + 2 }
        ];

        corners.forEach(c => {
          const treeGroup = new THREE.Group();

          const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 3.5, 8);
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 1.75;
          treeGroup.add(trunk);

          const foliageGeo = new THREE.DodecahedronGeometry(1.6);
          const foliage = new THREE.Mesh(foliageGeo, foliageMat);
          foliage.position.y = 4.2;
          treeGroup.add(foliage);

          treeGroup.position.set(c.x, 0, c.z);
          this.scene.add(treeGroup);

          const treeBox = new THREE.Box3();
          treeBox.setFromCenterAndSize(new THREE.Vector3(c.x, 2, c.z), new THREE.Vector3(0.8, 4, 0.8));
          this.colliders.push(treeBox);
        });
      }
    }
  }

  createPerimeterWalls() {
    const half = this.citySize / 2;
    const thickness = 6;
    const height = 50;

    const walls = [
      { x: 0, z: half, w: this.citySize, d: thickness },
      { x: 0, z: -half, w: this.citySize, d: thickness },
      { x: half, z: 0, w: thickness, d: this.citySize },
      { x: -half, z: 0, w: thickness, d: this.citySize }
    ];

    walls.forEach(w => {
      const box = new THREE.Box3();
      box.setFromCenterAndSize(new THREE.Vector3(w.x, height / 2, w.z), new THREE.Vector3(w.w, height, w.d));
      this.colliders.push(box);
    });
  }

  buildNavigationNodes() {
    this.roadNodes = [];
    const step = this.blockSize + this.roadWidth; // 70
    const halfSize = this.citySize / 2; // 140

    // Exact road grid coordinates matching createRoadGrid (-140, -70, 0, 70, 140)
    const roadCoords = [];
    for (let pos = -halfSize; pos <= halfSize; pos += step) {
      roadCoords.push(pos);
    }

    let nodeCounter = 0;
    const gridNodes = {};

    // 1. Create lane-aligned nodes for North, South, East, West lanes
    for (let rx of roadCoords) {
      for (let rz of roadCoords) {
        const keyN = `N_${rx}_${rz}`;
        const keyS = `S_${rx}_${rz}`;
        const keyE = `E_${rx}_${rz}`;
        const keyW = `W_${rx}_${rz}`;

        gridNodes[keyN] = { id: `rn_${nodeCounter++}`, x: rx + 4.5, z: rz, dir: 'N', rx, rz, next: [] };
        gridNodes[keyS] = { id: `rn_${nodeCounter++}`, x: rx - 4.5, z: rz, dir: 'S', rx, rz, next: [] };
        gridNodes[keyE] = { id: `rn_${nodeCounter++}`, x: rx, z: rz + 4.5, dir: 'E', rx, rz, next: [] };
        gridNodes[keyW] = { id: `rn_${nodeCounter++}`, x: rx, z: rz - 4.5, dir: 'W', rx, rz, next: [] };
      }
    }

    Object.values(gridNodes).forEach(n => this.roadNodes.push(n));

    // 2. Connect nodes strictly along road lanes and 90-degree intersection turns
    for (let n of this.roadNodes) {
      const idxX = roadCoords.indexOf(n.rx);
      const idxZ = roadCoords.indexOf(n.rz);
      const nextNodes = [];

      // Forward straight lane move
      if (n.dir === 'N' && idxZ < roadCoords.length - 1) {
        const targetKey = `N_${n.rx}_${roadCoords[idxZ + 1]}`;
        if (gridNodes[targetKey]) nextNodes.push(gridNodes[targetKey].id);
      } else if (n.dir === 'S' && idxZ > 0) {
        const targetKey = `S_${n.rx}_${roadCoords[idxZ - 1]}`;
        if (gridNodes[targetKey]) nextNodes.push(gridNodes[targetKey].id);
      } else if (n.dir === 'E' && idxX < roadCoords.length - 1) {
        const targetKey = `E_${roadCoords[idxX + 1]}_${n.rz}`;
        if (gridNodes[targetKey]) nextNodes.push(gridNodes[targetKey].id);
      } else if (n.dir === 'W' && idxX > 0) {
        const targetKey = `W_${roadCoords[idxX - 1]}_${n.rz}`;
        if (gridNodes[targetKey]) nextNodes.push(gridNodes[targetKey].id);
      }

      // Intersection turns (Right turn & Left turn)
      if (n.dir === 'N') {
        const rightTurn = `E_${n.rx}_${n.rz}`;
        const leftTurn = `W_${n.rx}_${n.rz}`;
        if (gridNodes[rightTurn]) nextNodes.push(gridNodes[rightTurn].id);
        if (gridNodes[leftTurn]) nextNodes.push(gridNodes[leftTurn].id);
      } else if (n.dir === 'S') {
        const rightTurn = `W_${n.rx}_${n.rz}`;
        const leftTurn = `E_${n.rx}_${n.rz}`;
        if (gridNodes[rightTurn]) nextNodes.push(gridNodes[rightTurn].id);
        if (gridNodes[leftTurn]) nextNodes.push(gridNodes[leftTurn].id);
      } else if (n.dir === 'E') {
        const rightTurn = `S_${n.rx}_${n.rz}`;
        const leftTurn = `N_${n.rx}_${n.rz}`;
        if (gridNodes[rightTurn]) nextNodes.push(gridNodes[rightTurn].id);
        if (gridNodes[leftTurn]) nextNodes.push(gridNodes[leftTurn].id);
      } else if (n.dir === 'W') {
        const rightTurn = `N_${n.rx}_${n.rz}`;
        const leftTurn = `S_${n.rx}_${n.rz}`;
        if (gridNodes[rightTurn]) nextNodes.push(gridNodes[rightTurn].id);
        if (gridNodes[leftTurn]) nextNodes.push(gridNodes[leftTurn].id);
      }

      n.next = nextNodes;
    }

    // Sidewalk Nodes for walking NPCs
    let pCounter = 0;
    this.sidewalkNodes = [];
    for (let rx of roadCoords) {
      for (let rz of roadCoords) {
        const pNode = { id: `sn_${pCounter++}`, x: rx + 10, z: rz + 10, next: [] };
        this.sidewalkNodes.push(pNode);
      }
    }

    for (let i = 0; i < this.sidewalkNodes.length; i++) {
      const current = this.sidewalkNodes[i];
      const neighbors = this.sidewalkNodes.filter(n => {
        const dist = Math.hypot(n.x - current.x, n.z - current.z);
        return dist > 5 && dist <= step + 15;
      });
      current.next = neighbors.map(n => n.id);
      if (current.next.length === 0 && this.sidewalkNodes.length > 1) {
        current.next.push(this.sidewalkNodes[(i + 1) % this.sidewalkNodes.length].id);
      }
    }
  }

  update(delta) {
    this.trafficLightTimer += delta;
    if (this.trafficLightTimer >= 10.0) {
      this.trafficLightTimer = 0;
      this.trafficLightState = (this.trafficLightState === 'GREEN') ? 'RED' : 'GREEN';

      // Update traffic signal light materials
      if (this.trafficLightMeshes) {
        const isGreen = (this.trafficLightState === 'GREEN');
        this.trafficLightMeshes.forEach(tl => {
          tl.top.material = isGreen ? new THREE.MeshBasicMaterial({ color: 0x440000 }) : this.lightRedMat;
          tl.bot.material = isGreen ? this.lightGreenMat : new THREE.MeshBasicMaterial({ color: 0x004400 });
        });
      }
    }
  }
}

window.World = World;
