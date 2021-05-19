import * as THREE from 'three';
import imagesLoaded from 'imagesloaded';
import gsap from 'gsap';
import FontFaceObserver from 'fontfaceobserver';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import Scroll from './scroll';
import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';
import composerPassFragment from '../shaders/composerPassFragment.glsl';
import composerPassVertex from '../shaders/composerPassVertex.glsl';

class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.el;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
    this.camera.position.z = 600;
    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;

    this.fragmentShader = options.fragmentShader;
    this.vertexShader = options.vertexShader;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.images = [...document.querySelectorAll('.item img')];

    const fontOpen = new Promise((resolve) => {
      new FontFaceObserver('Open Sans').load().then(() => {
        resolve();
      });
    });

    const fontPlayfair = new Promise((resolve) => {
      new FontFaceObserver('Playfair Display').load().then(() => {
        resolve();
      });
    });

    // Preload images
    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(document.querySelectorAll('img'), { background: true }, resolve);
    });

    this.currentScroll = 0;
    let allDone = [fontOpen, fontPlayfair, preloadImages];
    Promise.all(allDone).then((res) => {
      this.scroll = new Scroll({});
      this.addImages();
      this.setPosition();
      this.onMouseMove();
      this.resize();
      this.setupResize();
      this.composerPass();
      this.render();
    });
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    //custom shader pass
    let counter = 0.0;
    this.myEffect = {
      uniforms: {
        tDiffuse: { value: null },
        uScrollSpeed: { value: null }
      },
      vertexShader: composerPassVertex,
      fragmentShader: composerPassFragment
    };

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;

    this.composer.addPass(this.customPass);
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      wireframe: false,
      uniforms: {
        uTime: { value: 0 },
        uImage: { value: 0 },
        uHover: { value: new THREE.Vector2(0.5, 0.5) },
        uHoverState: { value: 0 },
        uColorStart: { value: new THREE.Color('#ec008c') },
        uColorEnd: { value: new THREE.Color('#ffffff') }
      }
    });

    this.materials = [];

    this.imageStore = this.images.map((img) => {
      const bounds = img.getBoundingClientRect();
      const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height, 10, 10);
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;

      const material = this.material.clone();
      img.addEventListener('mouseenter', () => {
        gsap.to(material.uniforms.uHoverState, {
          duration: 1,
          value: 1
        });
      });
      img.addEventListener('mouseout', () => {
        gsap.to(material.uniforms.uHoverState, {
          duration: 1,
          value: 0
        });
      });

      this.materials.push(material);
      material.uniforms.uImage.value = texture;

      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);

      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((imageObject) => {
      imageObject.mesh.position.y =
        this.currentScroll - imageObject.top + this.height / 2 - imageObject.height / 2;
      imageObject.mesh.position.x = imageObject.left - this.width / 2 + imageObject.width / 2;
    });
  }

  onMouseMove() {
    window.addEventListener(
      'mousemove',
      (event) => {
        this.mouse.x = (event.clientX / this.width) * 2 - 1;
        this.mouse.y = -(event.clientY / this.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
          const obj = intersects[0].object;
          obj.material.uniforms.uHover.value = intersects[0].uv;
        }
      },
      false
    );
  }

  render() {
    this.time += 0.05;
    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();
    this.customPass.uniforms.uScrollSpeed.value = this.scroll.speedTarget;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.composer.render();
    this.materials.forEach((material) => {
      material.uniforms.uTime.value = this.time;
    });
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({
  el: document.getElementById('webgl'),
  vertexShader: vertex,
  fragmentShader: fragment
});
