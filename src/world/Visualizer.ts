import * as THREE from "three";
import AudioAnalyzer from "../utils/AudioAnalyzer";
import vertexShader from "../shaders/vertex/barVertex.glsl?raw";
import fragmentShader from "../shaders/fragment/barFragment.glsl?raw";
import type Time from "../utils/Time";
import { Reflector } from "three/examples/jsm/Addons.js";

export default class Visualizer {
  scene: THREE.Scene;
  analyzer: AudioAnalyzer;
  time: Time;

  group: THREE.Group;
  bars: THREE.Mesh[] = [];
  centerSphere!: THREE.Mesh;
  particles!: THREE.Points;

  constructor(scene: THREE.Scene, analyzer: AudioAnalyzer, time: Time) {
    this.scene = scene;
    this.analyzer = analyzer;
    this.time = time;
    this.group = new THREE.Group();

    this.createCenterElement();
    this.createBars();
    this.createParticles();

    this.createFloor();

    this.scene.add(this.group);
  }

  private createCenterElement() {
    const geometry = new THREE.IcosahedronGeometry(4, 2);
    const material = new THREE.MeshStandardMaterial({
      color: "#ff0055",
      wireframe: true,
      emissive: "#ff0055",
      emissiveIntensity: 2,
    });
    this.centerSphere = new THREE.Mesh(geometry, material);
    this.group.add(this.centerSphere);
  }

  private createBars() {
    const count = 64;
    const radius = 12;
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);

    for (let i = 0; i < count; i++) {
      const barColor = new THREE.Color();
      barColor.setHSL(i / count, 0.8, 0.6);

      const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uAudioIntensity: { value: 0 },
          uColor: { value: barColor },
        },
      });
      const bar = new THREE.Mesh(geometry, material);

      const angle = (i / count) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      bar.lookAt(0, 0, 0);

      this.bars.push(bar);
      this.group.add(bar);
    }
  }

  private createFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const floor = new Reflector(geometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0x111111, // Màu tối để phản chiếu Neon đẹp nhất
    });
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1; // Nằm ngay dưới chân các cột nhạc
    this.scene.add(floor);
  }

  private createParticles() {
    const count = 10000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: "#ffffff",
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }

  /**
   * Cập nhật hệ thống hạt bụi không gian
   */
  private updateParticles(bassIntensity: number) {
    this.particles.rotation.y += 0.001;
    const positions = this.particles.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      // Hạt bay về phía camera (trục Z) dựa trên nhịp bass
      positions[i + 2] += 0.05 + bassIntensity * 0.4;

      // Nếu hạt bay quá gần (vượt qua camera), đưa nó ra xa lại phía sau
      if (positions[i + 2] > 50) {
        positions[i + 2] = -50;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Hàm update chính nhận bassIntensity từ World
   */
  update(bassIntensity: number) {
    const data = this.analyzer.getFrequencyData();

    // 1. Xử lý Bass cho Quả cầu và Hạt bụi
    const bassScale = 1 + bassIntensity * 1.5;
    this.centerSphere.scale.set(bassScale, bassScale, bassScale);
    this.centerSphere.rotation.y += 0.01;

    this.updateParticles(bassIntensity);

    // 2. Xử lý Mid cho các cột Bars
    this.bars.forEach((bar, index) => {
      const freq = data[index % 128];
      const material = bar.material as THREE.ShaderMaterial;

      // Cập nhật Uniforms cho Shader
      material.uniforms.uTime.value = this.time.elapsed * 0.001;
      material.uniforms.uAudioIntensity.value = freq / 255;

      const scale = (freq / 255) * 15 + 0.1;
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, scale, 0.2);
      bar.position.y = bar.scale.y / 2;
    });

    // 3. Xử lý Treble (Xoay Group)
    let treble = 0;
    for (let i = 100; i < 120; i++) treble += data[i];
    treble /= 20;

    this.group.rotation.y += 0.002 + (treble / 255) * 0.02;
  }
}
