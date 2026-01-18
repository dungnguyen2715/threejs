uniform float uTime;
uniform float uAudioIntensity;
varying vec2 vUv;
varying float vElevation;

void main() {
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Tạo hiệu ứng uốn lượn (Wave) dựa trên thời gian và cường độ âm thanh
    float elevation = sin(modelPosition.y * 3.0 + uTime * 5.0) * 0.2 * uAudioIntensity;
    modelPosition.x += elevation;
    modelPosition.z += elevation;

    vElevation = elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
}