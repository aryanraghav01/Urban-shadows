/* ==========================================================================
   Temple Run: Midas Obsidian - Particle Systems
   ========================================================================== */

class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.ambientEmbers = null;
    this.initAmbientEmbers();
  }

  initAmbientEmbers() {
    const emberCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    const scales = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 15 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      scales[i] = Math.random() * 0.15 + 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#f5d77f');
    grad.addColorStop(0.8, '#c59b27');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.35,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.ambientEmbers = new THREE.Points(geometry, material);
    this.scene.add(this.ambientEmbers);
  }

  updateAmbientEmbers(playerZ) {
    if (!this.ambientEmbers) return;
    const pos = this.ambientEmbers.geometry.attributes.position.array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 1] += 0.02;
      if (pos[i * 3 + 1] > 18) pos[i * 3 + 1] = 0.5;

      if (pos[i * 3 + 2] > playerZ + 15) {
        pos[i * 3 + 2] -= 60;
      } else if (pos[i * 3 + 2] < playerZ - 45) {
        pos[i * 3 + 2] += 60;
      }
    }
    this.ambientEmbers.geometry.attributes.position.needsUpdate = true;
  }

  createCoinBurst(x, y, z) {
    const burstCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(burstCount * 3);
    const velocities = [];

    for (let i = 0; i < burstCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities.push({
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 6 + 2,
        z: (Math.random() - 0.5) * 6
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffe89e,
      size: 0.4,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const pSystem = new THREE.Points(geometry, material);
    this.scene.add(pSystem);

    this.particles.push({
      mesh: pSystem,
      velocities: velocities,
      life: 1.0,
      decay: 0.04
    });
  }

  update(dt, playerZ) {
    this.updateAmbientEmbers(playerZ);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.material.opacity = p.life;
      const pos = p.mesh.geometry.attributes.position.array;
      for (let j = 0; j < p.velocities.length; j++) {
        pos[j * 3] += p.velocities[j].x * dt;
        pos[j * 3 + 1] += p.velocities[j].y * dt;
        pos[j * 3 + 2] += p.velocities[j].z * dt;
        p.velocities[j].y -= 9.8 * dt;
      }
      p.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }
}
