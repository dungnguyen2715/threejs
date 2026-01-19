import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import Sizes from "../utils/Sizes";

export default class Renderer {
  instance!: THREE.WebGLRenderer;
  composer!: EffectComposer;
  bloomPass!: UnrealBloomPass;
  canvas: HTMLCanvasElement;
  sizes: Sizes;

  constructor(canvas: HTMLCanvasElement, sizes: Sizes) {
    this.canvas = canvas;
    this.sizes = sizes;

    this.setInstance();
    this.setPostProcessing();
  }

  // private setInstance() {
  //     this.instance = new THREE.WebGLRenderer({
  //         canvas: this.canvas,
  //         antialias: true,
  //     });
  //     this.instance.outputColorSpace = THREE.SRGBColorSpace;
  //     this.instance.toneMapping = THREE.ReinhardToneMapping;
  //     this.instance.toneMappingExposure = 1;
  //     this.resize();
  // }

  private setInstance() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false, // TẮT antialias vì Post-processing sẽ tự xử lý, bật cả hai sẽ làm giảm FPS
    });
    this.instance.outputColorSpace = THREE.SRGBColorSpace;

    // Đổi sang NoToneMapping hoặc tăng mạnh Exposure để Bloom có "nguyên liệu" hoạt động
    this.instance.toneMapping = THREE.NoToneMapping;
    this.instance.toneMappingExposure = 1.5;
    this.resize();
  }

  private setPostProcessing() {
    // 1. Khởi tạo Composer
    this.composer = new EffectComposer(this.instance);
  }

  initPostProcessing(scene: THREE.Scene, camera: THREE.Camera) {
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      1.5, // Strength
      0.5, // Radius
      1, // threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));

    if (this.composer) {
      this.composer.setSize(this.sizes.width, this.sizes.height);
      this.composer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));
    }
  }

  update(scene: THREE.Scene, camera: THREE.Camera) {
    if (this.composer) {
      this.composer.render();
    } else {
      this.instance.render(scene, camera);
    }
  }
}
