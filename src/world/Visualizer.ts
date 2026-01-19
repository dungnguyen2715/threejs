import * as THREE from "three";
import AudioAnalyzer from "../utils/AudioAnalyzer";
import vertexShader from "../shaders/vertex/barVertex.glsl?raw";
import fragmentShader from "../shaders/fragment/barFragment.glsl?raw";
import type Time from "../utils/Time";
import { GLTFLoader, Reflector } from "three/examples/jsm/Addons.js";

export default class Visualizer {
  scene: THREE.Scene;
  analyzer: AudioAnalyzer;
  time: Time;

  group: THREE.Group;
  bars: THREE.Mesh[] = [];
  centerSphere!: THREE.Mesh;
  particles!: THREE.Points;

  djTable: THREE.Group | null = null;

  // Thêm vào phần khai báo thuộc tính ở đầu class
  private shockwaves: THREE.Mesh[] = [];
  private readonly maxShockwaves = 5; // Số lượng vòng tròn tối đa xuất hiện cùng lúc

  constructor(scene: THREE.Scene, analyzer: AudioAnalyzer, time: Time) {
    this.scene = scene;
    this.analyzer = analyzer;
    this.time = time;
    this.group = new THREE.Group();

    this.loadDJTableModel();
    this.createCenterElement();
    this.createBars();
    this.createParticles();
    this.createFloor();
    this.createShockwaves();
    this.scene.add(this.group);
  }

  private createShockwaves() {
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    for (let i = 0; i < this.maxShockwaves; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        wireframe: true, // Để nhìn giống lưới năng lượng, hoặc false nếu muốn quầng sáng đặc
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false, // Ngăn lỗi hiển thị đè lên sàn gương
        blending: THREE.AdditiveBlending, // Làm hiệu ứng phát sáng rực rỡ
      });

      const wave = new THREE.Mesh(geometry, material);
      // wave.rotation.x = -Math.PI / 2; // Nằm bẹt trên sàn
      // wave.position.y = 0.01; // Cao hơn sàn gương một chút để không bị nhấp nháy (Z-fighting)
      wave.visible = false; // Ban đầu ẩn đi

      this.shockwaves.push(wave);
      this.group.add(wave);
    }
  }
  private triggerShockwave(intensity: number) {
    // Tìm vòng tròn đầu tiên đang không hiển thị
    const wave = this.shockwaves.find((w) => !w.visible);

    if (wave) {
      wave.visible = true;
      wave.scale.set(1, 1, 1);
      (wave.material as THREE.MeshBasicMaterial).opacity = intensity * 0.8;

      // Đổi màu ngẫu nhiên theo tone nhạc của bạn (ví dụ: Trắng/Hồng/Xanh)
      const colors = ["#ffffff", "#ff0055", "#00ffff"];
      (wave.material as THREE.MeshBasicMaterial).color.set(
        colors[Math.floor(Math.random() * colors.length)],
      );
    }
  }

  private loadDJTableModel() {
    const loader = new GLTFLoader();

    loader.load(
      "/models/dj_set.glb", // Đường dẫn file bạn vừa copy vào
      (gltf) => {
        this.djTable = gltf.scene;

        // Điều chỉnh kích thước và vị trí bàn DJ
        this.djTable.scale.set(0.2, 0.2, 0.2);
        this.djTable.position.set(0, 0, 0);

        // Duyệt qua các phần của model để bật hiệu ứng phát sáng (nếu có)
        this.djTable.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            // Làm cho các chi tiết trên bàn DJ có thể phản chiếu ánh sáng Neon
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.emissiveIntensity = 0.5;
            }
          }
        });

        this.group.add(this.djTable);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Lỗi khi tải model:", error);
      },
    );
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
    if (this.djTable) {
      // 1. Đồng bộ độ nảy (Scale) - như đã nói ở bước trước
      const bounceScale = 0.2 * (1 + bassIntensity * 1.5);
      this.djTable.scale.set(bounceScale, bounceScale, bounceScale);
      const jumpHeight = 0.5 + bassIntensity * 2.0;
      this.djTable.position.y = jumpHeight;
      this.djTable.rotation.y += 0.005 + bassIntensity * 0.02;
    }

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

    // 1. Kiểm tra đỉnh Bass để kích hoạt vòng tròn
    // Nếu Bass cực mạnh (> 0.9) và cường độ thô của nhạc đang cao
    if (bassIntensity > 0.8) {
      this.triggerShockwave(bassIntensity);
    }

    // 2. Cập nhật chuyển động cho tất cả vòng tròn đang hiện diện
    this.shockwaves.forEach((wave) => {
      if (wave.visible) {
        const mat = wave.material as THREE.MeshBasicMaterial;
        // Lan tỏa rộng ra
        wave.scale.addScalar(1.2 + bassIntensity * 2.0);
        // Mờ dần theo thời gian
        mat.opacity -= 0.025;

        // Khi đã quá mờ hoặc quá to, ẩn đi để dùng lại (Recycle)
        if (mat.opacity <= 0 || wave.scale.x > 150) {
          wave.visible = false;
          mat.opacity = 0;
        }
      }
    });
  }
}
