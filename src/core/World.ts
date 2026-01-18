import * as THREE from "three";
import Scene from "./Scene";
import Camera from "./Camera";
import Renderer from "./Renderer";
import Time from "../utils/Time";
import Sizes from "../utils/Sizes";
import AudioAnalyzer from "../utils/AudioAnalyzer";
import Visualizer from "../world/Visualizer";

export default class World {
  // Sử dụng dấu ! để báo TS rằng chúng sẽ được khởi tạo
  scene!: THREE.Scene;
  camera!: Camera;
  renderer!: Renderer;
  time!: Time;
  sizes!: Sizes;
  analyzer!: AudioAnalyzer;
  visualizer!: Visualizer;
  canvas!: HTMLCanvasElement;
  private smoothBass: number = 0; // Thêm biến này ở trên cùng của class

  constructor() {
    // 1. Lấy Canvas trước tiên
    const canvasElement = document.querySelector("canvas.webgl");
    if (!canvasElement) throw new Error("Canvas not found");
    this.canvas = canvasElement as HTMLCanvasElement;

    // 2. Khởi tạo Utilities
    this.sizes = new Sizes();
    this.time = new Time();

    // 3. Khởi tạo Core (Truyền các tham số cần thiết)
    this.scene = new Scene().instance;
    this.camera = new Camera(); // File Camera.ts của bạn tự tìm canvas
    this.renderer = new Renderer(this.canvas, this.sizes);
    // 2. KÍCH HOẠT POST-PROCESSING TẠI ĐÂY
    // Bạn truyền scene và camera.instance vào để Composer biết nó cần render cái gì
    this.renderer.initPostProcessing(this.scene, this.camera.instance);
    // 4. Setup âm nhạc & Visualizer
    this.analyzer = new AudioAnalyzer("/sounds/music3.mp3");
    this.visualizer = new Visualizer(this.scene, this.analyzer, this.time);

    // 5. Lắng nghe sự kiện
    this.sizes.on("resize", () => this.resize());

    // Nếu dùng EventEmitter từ thư viện events
    this.time.on("tick", () => this.update());

    window.addEventListener("click", () => this.analyzer.play(), {
      once: true,
    });

    // 5. Lắng nghe sự kiện bàn phím cho Space
    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault(); // Ngăn trang bị cuộn xuống
        this.toggleMusic();
      }
    });

    // Click đầu tiên để kích hoạt AudioContext
    window.addEventListener("click", () => this.analyzer.play(), {
      once: true,
    });
  }

  toggleMusic() {
    // Gọi thẳng analyzer vì chỉ có 1 quả cầu
    this.analyzer.toggle();
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  // src/core/World.ts -> Hàm update()

  update() {
    this.camera.update();

    // 1. Tính toán cường độ Bass thô
    const audioData = this.analyzer.getFrequencyData();
    let bass = 0;
    const samples = 10;
    for (let i = 0; i < samples; i++) bass += audioData[i];
    const rawBassIntensity = bass / (samples * 255);

    // 2. TẠO SMOOTH BASS (Làm mượt)
    // Sử dụng lerp để giá trị không nhảy đột ngột từ 0 lên 1
    this.smoothBass = THREE.MathUtils.lerp(
      this.smoothBass,
      rawBassIntensity,
      0.1,
    );

    // 3. ĐIỀU KHIỂN CAMERA (Dùng smoothBass)
    this.camera.applyAudioReaction(this.smoothBass);

    // 4. TRUYỀN VÀO VISUALIZER (Dùng smoothBass cho hạt và cột nhạc)
    this.visualizer.update(this.smoothBass);

    // 5. ĐIỀU KHIỂN BLOOM (Dùng smoothBass)
    if (this.renderer.bloomPass) {
      const targetStrength = 1.0 + this.smoothBass * 2.0;
      this.renderer.bloomPass.strength = THREE.MathUtils.lerp(
        this.renderer.bloomPass.strength,
        targetStrength,
        0.1,
      );
    }

    // 6. FLASH EXPOSURE (Dùng smoothBass)
    if (this.renderer.instance) {
      const targetExposure = 1.0 + this.smoothBass * 1.5;
      this.renderer.instance.toneMappingExposure = THREE.MathUtils.lerp(
        this.renderer.instance.toneMappingExposure,
        targetExposure,
        0.2,
      );
    }

    this.renderer.update(this.scene, this.camera.instance);
  }
}
