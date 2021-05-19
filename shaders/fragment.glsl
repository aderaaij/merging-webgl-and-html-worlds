uniform float uTime;
uniform sampler2D uImage;
  
varying vec2 vUv;
varying float vNoise;

void main() {
  vec2 newUv = vUv; 
  // newUv = vec2(newUv.x, newUv.y  + 0.01 * sin(newUv.x * 10. + uTime * 0.5));
  vec4 image = texture2D(uImage, newUv); 
  float normalNoise = 0.5 * (vNoise + 0.5);
  // gl_FragColor = image + 0.3 * vec4(normalNoise);
  gl_FragColor = image;
}