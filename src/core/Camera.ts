// src/core/Camera.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class Camera {
  instance!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  canvas: HTMLCanvasElement;

  // Lưu lại FOV mặc định để hồi phục sau khi đập theo nhạc
  private readonly defaultFOV = 75;

  constructor() {
    const canvas = document.querySelector("canvas.webgl");
    this.canvas = canvas as HTMLCanvasElement;
    this.setInstance();
    this.setControls();
  }

  private setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      this.defaultFOV,
      window.innerWidth / window.innerHeight,
      0.1,
      500,
    );
    this.instance.position.set(18, 15, 18);
  }

  private setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;

    // --- NÂNG CẤP 1: Tự động xoay chậm ---
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5; // Xoay rất chậm để tạo chiều sâu
  }

  // --- NÂNG CẤP 2: Hàm phản hồi âm thanh ---
  applyAudioReaction(bassIntensity: number) {
    // bassIntensity truyền vào từ World (0 đến 1)
    // 1. Zoom theo nhịp (FOV)
    const targetFOV = this.defaultFOV + bassIntensity * 35;
    this.instance.fov = THREE.MathUtils.lerp(this.instance.fov, targetFOV, 0.2);
    this.instance.updateProjectionMatrix();

    // 2. Rung lắc (Shake) khi Bass cực mạnh (> 0.8)
    if (bassIntensity > 0.8) {
      const shake = 2;
      this.instance.position.x += (Math.random() - 0.5) * shake;
      this.instance.position.y += (Math.random() - 0.5) * shake;
      return true
    }
    return false
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }

  update() {
    this.controls.update(); // autoRotate chỉ chạy khi có dòng này
  }
}
