uniform float uTime;
uniform sampler2D uImage;
uniform float uHoverState;
varying vec2 vUv;
varying float vNoise;

void main() {
  vec2 newUv = vUv; 
  // // newUv = vec2(newUv.x, newUv.y  + 0.01 * sin(newUv.x * 10. + uTime * 0.5));
  // vec4 image = texture2D(uImage, newUv); 
  // float normalNoise = 0.5 * (vNoise + 0.5);
  // // gl_FragColor = image + 0.3 * vec4(normalNoise);
  // gl_FragColor = image;
    vec2 p = newUv;
    float x = uHoverState;
    x = smoothstep(.0,1.0,(x*2.0+p.y-1.0));
    vec4 f = mix(
      texture2D(uImage, (p-.5)*(1.-x)+.5), 
      texture2D(uImage, (p-.5)*x+.5), 
      x);
    gl_FragColor = f;
}