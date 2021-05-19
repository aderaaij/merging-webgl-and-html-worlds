 uniform sampler2D tDiffuse;
  varying vec2 vUv;
  uniform float uScrollSpeed;
  void main(){
    vec2 newUv = vUv;
    float area = smoothstep(0.4,0.,vUv.y);
    area = pow(area,4.);
    newUv.x -= (vUv.x - 0.5)*0.1*area*uScrollSpeed;
    gl_FragColor = texture2D( tDiffuse, newUv);
    // gl_FragColor = vec4(area,0.,0.,1.);
  }