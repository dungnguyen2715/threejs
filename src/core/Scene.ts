import * as THREE from "three";

export default class Scene {
  instance: THREE.Scene;

  constructor() {
    this.instance = new THREE.Scene();
    this.setEnvironment();
  }

  private setEnvironment() {
    // Màu nền tối giúp các hiệu ứng ánh sáng âm nhạc nổi bật hơn
    this.instance.background = new THREE.Color("#0b0b0b");

    // Thêm sương mù để tạo chiều sâu cho không gian
    this.instance.fog = new THREE.Fog("#0b0b0b", 1, 50);
  }
}
