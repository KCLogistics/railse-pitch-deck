// --- Animation variables ---
let threeJsInitialized = false;
let animationFrameId;
let particles, lines;
const particleCount = 150;
const connectionDistance = 120;
const sparkThreshold = 5;
const defaultParticleColor = new THREE.Color(0x9CA3AF);
const sparkColor = new THREE.Color(0xFFFF00);

// --- Animation Loop ---
function animateLoop() {
    animationFrameId = requestAnimationFrame(animateLoop);

    const positions = particles.geometry.attributes.position.array;
    const colors = particles.geometry.attributes.color.array;
    const velocities = particles.geometry.velocities;

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;

        if (positions[i * 3 + 1] < -384 || positions[i * 3 + 1] > 384) velocities[i].y = -velocities[i].y;
        if (positions[i * 3] < -512 || positions[i * 3] > 512) velocities[i].x = -velocities[i].x;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    const linePositions = [];
    const connectionCounts = new Array(particleCount).fill(0);

    for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < connectionDistance) {
                linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                connectionCounts[i]++;
                connectionCounts[j]++;
            }
        }
    }
    lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lines.geometry.attributes.position.needsUpdate = true;

    for (let i = 0; i < particleCount; i++) {
        if (connectionCounts[i] > sparkThreshold) {
            sparkColor.toArray(colors, i * 3);
        } else {
            defaultParticleColor.toArray(colors, i * 3);
        }
    }
    particles.geometry.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
}

/**
 * Starts the animation loop.
 */
function startAnimation() {
    if (!animationFrameId) {
        animateLoop();
    }
}

function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Initializes the Three.js scene, camera, and renderer.
 * Creates the particle system and lines and adds them to the scene.
 */
function initThreeJS() {
    const bgCanvas = document.getElementById('bg-canvas');
    if (!bgCanvas) return;

    threeJsInitialized = true;
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, bgCanvas.clientWidth / bgCanvas.clientHeight, 0.1, 1000);
    camera.position.z = 300;

    renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true });
    renderer.setSize(bgCanvas.clientWidth, bgCanvas.clientHeight);
    renderer.setClearColor(0x000000, 0); 

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * bgCanvas.clientWidth;
        positions[i3 + 1] = (Math.random() - 0.5) * bgCanvas.clientHeight;
        positions[i3 + 2] = (Math.random() - 0.5) * 300;
        
        defaultParticleColor.toArray(colors, i3);

        velocities.push({
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
        });
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.velocities = velocities;

    const particleMaterial = new THREE.PointsMaterial({
        vertexColors: true, 
        size: 2.5,
        transparent: true,
        opacity: 1
    });
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xD1D5DB,
        transparent: true,
        opacity: 0.8
    });
    lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
}
