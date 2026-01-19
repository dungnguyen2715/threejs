varying vec2 vUv;
varying float vDisplacement;
uniform float uTime;
uniform float uAudioIntensity;

void main() {
    vUv = uv;
    // Tạo độ lồi lõm dựa trên nhiễu nhiễu (noise) và nhạc
    float noise = sin(position.x * 2.0 + uTime) * cos(position.y * 2.0 + uTime);
    vDisplacement = noise * uAudioIntensity * 2.0;
    
    vec3 newPosition = position + normal * vDisplacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}