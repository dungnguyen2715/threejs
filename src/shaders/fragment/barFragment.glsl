uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
varying float vElevation;

void main() {
    // Tạo hiệu ứng dải sáng chạy từ dưới lên trên
    float pulse = sin(vUv.y * 10.0 - uTime * 10.0) * 0.5 + 0.5;
    vec3 finalColor = mix(uColor, vec3(1.0), pulse * 0.3);
    
    // Thêm chút sắc thái dựa trên độ uốn lượn (vElevation)
    finalColor += vElevation * 2.0;

    gl_FragColor = vec4(finalColor, 1.0);
}