import { EventEmitter } from 'events';

export default class Sizes extends EventEmitter {
    width: number;
    height: number;
    pixelRatio: number;

    constructor() {
        super();

        // Khởi tạo các thông số ban đầu
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixelRatio = Math.min(window.devicePixelRatio, 2); // Giới hạn tối đa là 2 để tối ưu hiệu năng

        // Lắng nghe sự kiện resize
        window.addEventListener('resize', () => {
            // Cập nhật thông số
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.pixelRatio = Math.min(window.devicePixelRatio, 2);

            // Phát tín hiệu (Emit) để các class khác biết
            this.emit('resize');
        });
    }
}