import * as THREE from 'https://unpkg.com/three@0.160.1/build/three.module.js';

const canvas = document.querySelector('#balloon-canvas');

if (canvas) {
  const colors = ['#F9C4D2', '#F4A7BB', '#E8789A', '#E8D5F5', '#FFF0C8', '#F0D080'];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  const balloonGroup = new THREE.Group();
  const balloons = [];
  const mouse = new THREE.Vector2();
  const clock = new THREE.Clock();

  camera.position.set(0, 0, 5);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new THREE.AmbientLight(0xffffff, 1.8));

  const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.1);
  keyLight.position.set(4, 7, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xf9c4d2, 0.9);
  fillLight.position.set(-5, 2, 4);
  scene.add(fillLight);
  scene.add(balloonGroup);

  const gradientMap = createGradientMap();
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

  const balloonLayout = [
    [-5.6, -3.5, -2.7, 0.7],
    [-2.6, -3.2, -1.7, 0.62],
    [0.2, -3.45, -2.6, 0.68],
    [2.8, -3.15, -1.4, 0.72],
    [5.4, -3.55, -2.4, 0.6],
    [-4.6, -1.75, -1.9, 0.76],
    [-1.8, -1.45, -2.8, 0.66],
    [0.9, -1.7, -1.1, 0.74],
    [3.6, -1.35, -2.2, 0.64],
    [-5.2, 0.0, -2.6, 0.58],
    [-2.4, 0.2, -1.2, 0.72],
    [0.0, -0.1, -2.9, 0.56],
    [2.3, 0.15, -1.5, 0.7],
    [5.1, 0.35, -2.4, 0.6],
    [-3.8, 1.65, -2.1, 0.64],
    [-1.3, 1.45, -1.0, 0.58],
    [1.4, 1.55, -2.7, 0.66],
    [3.9, 1.75, -1.6, 0.6],
    [-4.9, 3.15, -2.8, 0.52],
    [-2.2, 3.0, -1.8, 0.56],
    [2.2, 3.05, -2.4, 0.54],
    [4.9, 3.2, -1.7, 0.52]
  ];

  balloonLayout.forEach(([x, y, z, scale]) => {
    addBalloon({
      scale,
      basePosition: new THREE.Vector3(x, y, z),
      floatAmplitude: THREE.MathUtils.randFloat(0.24, 0.48),
      swayAmplitude: THREE.MathUtils.randFloat(0.08, 0.22)
    });
  });

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);

  animate();

  function createGradientMap() {
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 4;
    mapCanvas.height = 1;
    const context = mapCanvas.getContext('2d');
    const tones = ['#9f6f80', '#e89ab2', '#ffd9e4', '#ffffff'];
    tones.forEach((tone, index) => {
      context.fillStyle = tone;
      context.fillRect(index, 0, 1, 1);
    });
    const texture = new THREE.CanvasTexture(mapCanvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  function createString(scale) {
    const points = [
      new THREE.Vector3(0, -1.02, 0),
      new THREE.Vector3(0.08 * scale, -1.75, 0.03),
      new THREE.Vector3(-0.12 * scale, -2.35, -0.02),
      new THREE.Vector3(0.1 * scale, -2.95, 0.02)
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 24, 0.015, 8, false);
    const material = new THREE.MeshBasicMaterial({ color: '#C49080' });
    return new THREE.Mesh(geometry, material);
  }

  function addBalloon({
    scale,
    basePosition,
    floatAmplitude,
    swayAmplitude,
    color,
    floatSpeed = THREE.MathUtils.randFloat(0.3, 0.8),
    swaySpeed = THREE.MathUtils.randFloat(0.2, 0.5),
    rotateSpeed = THREE.MathUtils.randFloat(0.04, 0.1),
    phase = Math.random() * Math.PI * 2
  }) {
    const balloonColor = color || colors[balloons.length % colors.length];
    const material = new THREE.MeshToonMaterial({
      color: balloonColor,
      gradientMap,
      emissive: balloonColor,
      emissiveIntensity: 0.08
    });
    const balloon = new THREE.Mesh(sphereGeometry, material);
    balloon.scale.set(scale * 0.88, scale * 1.12, scale);
    balloon.position.copy(basePosition);

    const string = createString(scale);
    balloon.add(string);

    const knot = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.18, 16),
      new THREE.MeshToonMaterial({ color: balloonColor, gradientMap })
    );
    knot.position.set(0, -1.03, 0);
    knot.rotation.z = Math.PI;
    balloon.add(knot);

    balloonGroup.add(balloon);
    balloons.push({
      mesh: balloon,
      basePosition,
      floatSpeed,
      floatAmplitude,
      swaySpeed,
      swayAmplitude,
      phase,
      rotateSpeed,
      scrollSpeed: THREE.MathUtils.randFloat(0.0015, 0.006)
    });
  }

  function handleMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((event.clientY / window.innerHeight) * 2 - 1);
  }

  function handleScroll() {
    balloonGroup.userData.scrollY = window.scrollY;
  }

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();

    balloons.forEach((balloon) => {
      const { mesh, basePosition, floatSpeed, floatAmplitude, swaySpeed, swayAmplitude, phase, rotateSpeed, scrollSpeed } = balloon;
      const scrollOffset = (balloonGroup.userData.scrollY || 0) * scrollSpeed;
      mesh.position.y = basePosition.y + scrollOffset + Math.sin(elapsed * floatSpeed + phase) * floatAmplitude;
      mesh.position.x = basePosition.x + Math.sin(elapsed * swaySpeed + phase) * swayAmplitude;
      mesh.rotation.z = Math.sin(elapsed * rotateSpeed + phase) * 0.08;
      mesh.rotation.y += delta * 0.05;
    });

    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.04;
    camera.position.z += (5 - camera.position.z) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
}
