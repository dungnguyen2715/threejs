varying vec2 vUv;
varying float vDisplacement;
uniform float uTime;
uniform vec3 uColor;

void main() {
    // Tạo hiệu ứng vân sáng dựa trên độ lồi lõm (displacement)
    float intensity = vDisplacement * 0.5 + 0.5;
    vec3 glowColor = uColor * (intensity + 0.5);
    
    // Thêm hiệu ứng hào quang (Glow) ở rìa
    gl_FragColor = vec4(glowColor, 1.0);
}