import * as THREE from "three";
import Scene from "./Scene";
import Camera from "./Camera";
import Renderer from "./Renderer";
import Time from "../utils/Time";
import Sizes from "../utils/Sizes";
import World from "./World"; // Nay là các Music Worlds đơn lẻ

export default class Universe {
  scene: THREE.Scene;
  camera: Camera;
  renderer: Renderer;
  time: Time;
  sizes: Sizes;
  canvas: HTMLCanvasElement;

  worlds: World[] = [];
  activeWorld: World | null = null;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;

  constructor() {
    const canvasElement = document.querySelector("canvas.webgl");
    if (!canvasElement) throw new Error("Canvas not found");
    this.canvas = canvasElement as HTMLCanvasElement;

    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new Scene().instance;
    this.camera = new Camera();
    this.renderer = new Renderer(this.canvas, this.sizes);
    this.renderer.initPostProcessing(this.scene, this.camera.instance);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.createPlaylist();
    this.setupInteractions();

    this.sizes.on("resize", () => this.resize());
    this.time.on("tick", () => this.update());
  }

  private createPlaylist() {
    const playlist = [
      {
        id: 1,
        src: "/sounds/music.mp3",
        pos: new THREE.Vector3(-20, 10, -10),
        color: "#ff0055",
      },
      {
        id: 2,
        src: "/sounds/music1.mp3",
        pos: new THREE.Vector3(20, 12, -15),
        color: "#00ffcc",
      },
      {
        id: 3,
        src: "/sounds/music2.mp3",
        pos: new THREE.Vector3(0, 15, 10),
        color: "#ffff00",
      },
    ];

    playlist.forEach((data) => {
      // Khởi tạo mỗi bài hát là một World riêng biệt
      const world = new World(
        this.scene,
        this.time,
        data.src,
        data.pos,
        data.color,
      );
      this.worlds.push(world);
    });
  }

  private setupInteractions() {
    window.addEventListener("click", (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera.instance);

      // Kiểm tra va chạm với quả cầu của từng World
      const spheres = this.worlds.map((w) => w.visualizer.centerSphere);
      const intersects = this.raycaster.intersectObjects(spheres);

      if (intersects.length > 0) {
        const clickedSphere = intersects[0].object;
        const targetWorld = this.worlds.find(
          (w) => w.visualizer.centerSphere === clickedSphere,
        );

        if (targetWorld) {
          if (this.activeWorld) this.activeWorld.stop();
          this.activeWorld = targetWorld;
          this.activeWorld.play();
        }
      }
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();

    // Cập nhật tất cả các World (để các quả cầu luôn nhấp nhô)
    this.worlds.forEach((world) => world.update(world === this.activeWorld));

    // Xử lý Bloom/Exposure dựa trên World đang active
    if (this.activeWorld && this.renderer.bloomPass) {
      const intensity = this.activeWorld.smoothBass;
      this.renderer.bloomPass.strength = THREE.MathUtils.lerp(
        this.renderer.bloomPass.strength,
        1.0 + intensity * 2.0,
        0.1,
      );
      this.camera.applyAudioReaction(intensity);
    }

    this.renderer.update(this.scene, this.camera.instance);
  }
}
