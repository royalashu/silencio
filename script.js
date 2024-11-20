const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3.0; // Adjust for brightness

document.querySelector(".model").appendChild(renderer.domElement);

// Add Ambient and Directional Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

let model;
const loader = new THREE.GLTFLoader();
loader.load("josta.glb", function (gltf) {
  model = gltf.scene;
  model.traverse((node) => {
    if (node.isMesh) {
      if (node.material) {
        node.material.metalness = 0.3;
        node.material.roughness = 0.4;
        node.material.envMapIntensity = 1.5;
      }
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.z = maxDim * 1.5;

  // Initial scale animation
  model.scale.set(0, 0, 0);
  gsap.to(model.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "power2.in" });

  animate();
});

const floatAmplitude = 0.2;
const floatSpeed = 1.5;
const rotatingSpeed = 0.3;
let isFloating = true;
let currentScroll = 0;

const stickyHeight = window.innerHeight;
const scannerSection = document.querySelector(".scanner");
const scannerPosition = scannerSection.offsetTop;
const scanContainer = document.querySelector(".scan-container");

ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "top -10",
  onEnterBack: () => {
    if (model) {
      gsap.to(model.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "power2.in" });
      isFloating = true;
    }
    gsap.to(scanContainer, { scale: 1, duration: 1, ease: "power2" });
  },
});

ScrollTrigger.create({
  trigger: ".scanner",
  start: "top top",
  end: `${stickyHeight}px`,
  pin: true,
  onEnter: () => {
    if (model) {
      isFloating = false;
      model.position.y = 0;

      gsap.to(model.rotation, {
        y: model.rotation.y + Math.PI * 2,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.to(model.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1,
            ease: "power2.in",
            onComplete: () => {
              gsap.to(scanContainer, { scale: 0, duration: 0.5, ease: "power2.in" });
            },
          });
        },
      });
    }
  },
  onLeaveBack: () => {
    gsap.set(scanContainer, { scale: 0 });
    gsap.to(scanContainer, { scale: 1, duration: 1, ease: "power2.out" });
  },
});

lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
});

function animate() {
  if (model && isFloating) {
    const floatOffset = Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
    model.position.y = floatOffset;
  }

  const scrollProgress = Math.min(currentScroll / scannerPosition, 1);

  if (scrollProgress < 1) {
    model.rotation.x = scrollProgress * Math.PI * 2;
  }

  model.rotation.y += 0.001 * rotatingSpeed;

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}
