import * as THREE from 'three';

// --- SCENE SETUP ---
let scene, camera, renderer, clock;
let animationContainer; // Use a dedicated variable for the container
let animationId; // To control the animation loop

// --- CORE OBJECTS ---
let aiCore, transporterOrbit, customerOrbit, energyWave1, energyWave2;

// --- WAVE STATES ---
let waveState1 = { active: false, startTime: 0, duration: 1.5 };
let waveState2 = { active: false, startTime: 0, duration: 1.2 };

function init(container) {
    // Set the container for other functions to use
    animationContainer = container;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    const width = animationContainer.clientWidth;
    const height = animationContainer.clientHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 25);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Make sure renderer background is transparent to see the slide's dark background
    renderer.setClearColor(0x000000, 0); 
    animationContainer.appendChild(renderer.domElement);

    // --- CREATE THE VISUAL ELEMENTS ---
    const coreRadius = 2.5;
    aiCore = createParticleSphere(coreRadius, 3000, 0x00aaff, 0.06);
    scene.add(aiCore);
    
    const coreLight = new THREE.PointLight(0x00aaff, 2, 100);
    scene.add(coreLight);

    const transporterRadius = 8;
    transporterOrbit = createParticleOrbit(transporterRadius, 5000, 0xffffff, 0.05);
    scene.add(transporterOrbit);

    const customerRadius = 14;
    customerOrbit = createParticleOrbit(customerRadius, 7000, 0x88aaff, 0.04);
    scene.add(customerOrbit);
    
    energyWave1 = createWaveRing(coreRadius + 0.1, 1000, 0x00aaff, 0.08);
    energyWave1.visible = false;
    scene.add(energyWave1);

    energyWave2 = createWaveRing(transporterRadius, 1500, 0xffffff, 0.07);
    energyWave2.visible = false;
    scene.add(energyWave2);

    window.addEventListener('resize', onWindowResize, false);
}

function createParticleSphere(radius, particleCount, color, size) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
        positions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Points(geometry, material);
}

function createParticleOrbit(radius, particleCount, color, size) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        positions.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.5, Math.sin(angle) * radius);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.rotation.x = Math.PI / 6;
    return particleSystem;
}

function createWaveRing(radius, particleCount, color, size) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        positions.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.2, Math.sin(angle) * radius);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.rotation.x = Math.PI / 6;
    return particleSystem;
}

function onWindowResize() {
    // Use the stored container variable
    if (!animationContainer) return;
    const width = animationContainer.clientWidth;
    const height = animationContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    if (aiCore) {
        aiCore.rotation.y = elapsedTime * 0.2;
        aiCore.rotation.x = elapsedTime * 0.15;
        const pulse = (Math.sin(elapsedTime * 1.5) + 1) / 2;
        aiCore.material.size = 0.06 + pulse * 0.03;
        aiCore.scale.set(0.95 + pulse * 0.1, 0.95 + pulse * 0.1, 0.95 + pulse * 0.1);
    }
    if (transporterOrbit) transporterOrbit.rotation.y = elapsedTime * 0.1;
    if (customerOrbit) customerOrbit.rotation.y = elapsedTime * 0.07;
    
    const ripple = (Math.sin(elapsedTime * 1.5) + 1) / 2;
    if (transporterOrbit) transporterOrbit.material.size = 0.05 + ripple * 0.03;
    if (customerOrbit) customerOrbit.material.size = 0.04 + ((Math.sin(elapsedTime * 1.5 - 0.5) + 1) / 2) * 0.02;

    if (!waveState1.active && !waveState2.active && Math.floor(elapsedTime) % 4 === 0) {
        if (Math.abs(elapsedTime - waveState1.startTime) > 1) {
            waveState1.active = true;
            waveState1.startTime = elapsedTime;
            energyWave1.visible = true;
        }
    }

    if (waveState1.active) {
        const progress = (elapsedTime - waveState1.startTime) / waveState1.duration;
        if (progress < 1.0) {
            const scale = 1.0 + progress * (8 / 2.6 - 1);
            energyWave1.scale.set(scale, scale, scale);
            energyWave1.material.opacity = progress < 0.5 ? progress * 2 : 1.0 - (progress - 0.5) * 2;
        } else {
            waveState1.active = false;
            energyWave1.visible = false;
            energyWave1.material.opacity = 0;
            energyWave1.scale.set(1, 1, 1);
            waveState2.active = true;
            waveState2.startTime = elapsedTime;
            energyWave2.visible = true;
        }
    }
    
    if (waveState2.active) {
        const progress = (elapsedTime - waveState2.startTime) / waveState2.duration;
        if (progress < 1.0) {
            const scale = 1.0 + progress * (14 / 8 - 1);
            energyWave2.scale.set(scale, scale, scale);
            energyWave2.material.opacity = progress < 0.5 ? progress * 2 : 1.0 - (progress - 0.5) * 2;
        } else {
            waveState2.active = false;
            energyWave2.visible = false;
            energyWave2.material.opacity = 0;
            energyWave2.scale.set(1, 1, 1);
        }
    }

    renderer.render(scene, camera);
}

// Make this function globally available for index.html to call
window.initMoatAnimation = function() {
    // Find the correct container using the new ID
    const container = document.getElementById('moat-animation-container');
    if (container && container.childElementCount === 0) { // Only init if it's empty
        init(container);
        animate();
    }
}

// Add a function to stop the animation to prevent memory leaks
window.stopMoatAnimation = function() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}