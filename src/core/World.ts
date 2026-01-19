import * as THREE from "three";
import Scene from "./Scene";
import Camera from "./Camera";
import Renderer from "./Renderer";
import Time from "../utils/Time";
import Sizes from "../utils/Sizes";
import AudioAnalyzer from "../utils/AudioAnalyzer";
import Visualizer from "../world/Visualizer";
import gsap from "gsap";

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
  private smoothBass: number = 0;
  private isZoomedIn: boolean = false;
  // Thêm vào trong class World
  private cameraPresets = [
    { position: { x: 18, y: 15, z: 18 }, fov: 75, name: "Góc rộng tổng cảnh" },
    { position: { x: 0, y: 5, z: 10 }, fov: 85, name: "Cận cảnh bàn DJ" },
    { position: { x: -20, y: 2, z: 0 }, fov: 70, name: "Góc thấp nghiêng" },
    {
      position: { x: 0, y: 30, z: 1 },
      fov: 60,
      name: "Góc nhìn từ trên cao (Top-down)",
    },
    {
      position: { x: 0, y: 6, z: 6 },
      fov: 85,
      name: "Góc ngay DJ",
    },
  ];
  private currentPresetIndex = 0;
  private autoCameraTimer: any = null;

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
    this.camera = new Camera();
    this.renderer = new Renderer(this.canvas, this.sizes);
    this.renderer.initPostProcessing(this.scene, this.camera.instance);
    // 4. Setup âm nhạc & Visualizer
    this.analyzer = new AudioAnalyzer("/sounds/music3.mp3");
    this.visualizer = new Visualizer(this.scene, this.analyzer, this.time);

    // 5. Lắng nghe sự kiện
    this.sizes.on("resize", () => this.resize());

    // Nếu dùng EventEmitter từ thư viện events
    this.time.on("tick", () => this.update());
    this.setupEvents();
  }

  private setupEvents() {
    const overlay = document.getElementById("intro-overlay");

    const startExperience = () => {
      if (overlay && !overlay.classList.contains("hidden")) {
        overlay.classList.add("hidden");
        this.analyzer.play();

        // Kích hoạt đổi góc cam tự động mỗi 10s
        if (!this.autoCameraTimer) {
          this.autoCameraTimer = setInterval(() => {
            if (!this.analyzer.audio.paused) this.switchCameraView();
          }, 10000);
        }
      }
    };

    window.addEventListener("click", startExperience, { once: true });

    // 5. Lắng nghe sự kiện bàn phím cho Space
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (overlay && !overlay.classList.contains("hidden")) {
          startExperience();
        } else {
          this.toggleMusic();
        }
      }
      if (e.code === "Enter") this.toggleZoom();
    });
  }
  private switchCameraView() {
    // Chọn preset tiếp theo
    this.currentPresetIndex =
      (this.currentPresetIndex + 1) % this.cameraPresets.length;
    const preset = this.cameraPresets[this.currentPresetIndex];

    // GSAP di chuyển vị trí Camera
    gsap.to(this.camera.instance.position, {
      x: preset.position.x,
      y: preset.position.y,
      z: preset.position.z,
      duration: 3, // Di chuyển trong 3 giây cho mượt
      ease: "power2.inOut",
    });

    // GSAP thay đổi FOV (Góc nhìn rộng/hẹp)
    gsap.to(this.camera.instance, {
      fov: preset.fov,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: () => this.camera.instance.updateProjectionMatrix(),
    });

    // Đảm bảo camera luôn nhìn về tâm (bàn DJ/quả cầu)
    // Lưu ý: Nếu bạn đang dùng OrbitControls, cần cập nhật target
    if (this.camera.controls) {
      gsap.to(this.camera.controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 3,
      });
    }
  }

  private toggleZoom() {
    this.isZoomedIn = !this.isZoomedIn;

    if (this.isZoomedIn) {
      // HIỆU ỨNG ÙA VÀO TÂM (Zoom-In)
      // Di chuyển camera đến sát bàn DJ (ví dụ tọa độ x:0, y:5, z:10)
      gsap.to(this.camera.instance.position, {
        x: 0,
        y: 6,
        z: 6,
        duration: 2, // Thời gian bay là 2 giây
        ease: "expo.out",
        onUpdate: () => this.camera.instance.updateProjectionMatrix(),
      });

      gsap.to(this.camera.instance, {
        fov: 85,
        duration: 1.5,
        onUpdate: () => this.camera.instance.updateProjectionMatrix(),
      });
    } else {
      // HIỆU ỨNG ÙA RA GÓC TỔNG (Zoom-Out)
      // Trả camera về vị trí ban đầu (ví dụ tọa độ cũ của bạn là z:40)
      gsap.to(this.camera.instance.position, {
        x: 18,
        y: 15,
        z: 18,
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate: () => this.camera.instance.updateProjectionMatrix(),
      });
      gsap.to(this.camera.instance, {
        fov: 75,
        duration: 2,
        onUpdate: () => this.camera.instance.updateProjectionMatrix(),
      });
    }
  }

  toggleMusic() {
    this.analyzer.toggle();
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();

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
    const isShock = this.camera.applyAudioReaction(this.smoothBass);

    if (this.renderer.instance) {
      let targetExposure = 1.0; // Mức sáng bình thường
      let targetBgColor = new THREE.Color("#000000"); // Màu nền bình thường (đen)

      if (isShock) {
        // Khi có cú hích Bass: Đẩy sáng cực đại và đổi nền thành trắng
        targetExposure = 4.0;
        targetBgColor = new THREE.Color("#ffffff");
      }

      // Dùng LERP để mọi thứ hồi phục về trạng thái cũ một cách mượt mà
      // Hồi phục Exposure
      this.renderer.instance.toneMappingExposure = THREE.MathUtils.lerp(
        this.renderer.instance.toneMappingExposure,
        targetExposure,
        0.1, // Tốc độ hồi phục (càng nhỏ càng chậm)
      );
      // Hồi phục màu nền Scene
      this.scene.background = (this.scene.background as THREE.Color).lerp(
        targetBgColor,
        0.1,
      );
    }

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
    // if (this.renderer.instance) {
    //   const targetExposure = 1.0 + this.smoothBass * 1.5;
    //   this.renderer.instance.toneMappingExposure = THREE.MathUtils.lerp(
    //     this.renderer.instance.toneMappingExposure,
    //     targetExposure,
    //     0.2,
    //   );
    // }

    this.renderer.update(this.scene, this.camera.instance);
  }
}
