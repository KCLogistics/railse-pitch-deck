import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Global State Variables ---
// These will hold the core components of our animation
let renderer, composer, controls, scene, camera, onWindowResize;
let animationFrameId;

// Animation-specific state
let rootNetwork, directionalLight, sparklePool = [], learnedMaterial, networkMaterial;
let blueRootIndices = [], learnedCount = 0, totalRoots = 0;
let animationState = 'IDLE', stateTimer = 0;
const clock = new THREE.Clock();

// --- Standalone Helper Functions ---

function createMajesticTree(x, z) {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8, side: THREE.DoubleSide });
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    const branchPoints = [];
    const leafPoints = [];

    function generateBranches(startPoint, direction, depth, thickness) {
        if (depth <= 0) {
            leafPoints.push(startPoint.clone());
            return;
        }
        const length = Math.random() * 4 + (12 - depth);
        const endPoint = startPoint.clone().add(direction.clone().multiplyScalar(length));
        const curve = new THREE.CatmullRomCurve3([startPoint, endPoint]);
        branchPoints.push({ curve, thickness });
        if (depth < 6) {
            const pointsOnBranch = Math.floor(length / 2.5);
            for (let i = 1; i <= pointsOnBranch; i++) {
                leafPoints.push(curve.getPoint(i / (pointsOnBranch + 1)));
            }
        }
        const sway = new THREE.Euler(0, Math.sin(performance.now() * 0.0001 + x) * 0.02, 0);
        const numBranches = (depth > 3) ? (Math.floor(Math.random() * 2) + 1) : (Math.floor(Math.random() * 4) + 3);
        for (let i = 0; i < numBranches; i++) {
            let newDirection = direction.clone().applyEuler(new THREE.Euler((Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.8)).applyEuler(sway);
            newDirection.lerp(new THREE.Vector3(0, 1, 0), 0.15).normalize();
            generateBranches(endPoint, newDirection, depth - 1, thickness * 0.65);
        }
    }
    generateBranches(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 1, 0).normalize(), 7, 2.5);
    branchPoints.forEach(branch => treeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(branch.curve, 1, branch.thickness, 5, false), trunkMaterial)));
    const leafGeometry = new THREE.PlaneGeometry(2.5, 2.5);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x3CB371, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.0 });
    const totalLeaves = leafPoints.length * 3;
    if (totalLeaves > 0) {
        const instancedLeaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, totalLeaves);
        const dummy = new THREE.Object3D();
        let leafIndex = 0;
        for (let i = 0; i < leafPoints.length; i++) {
            for (let j = 0; j < 3; j++) {
                dummy.position.copy(leafPoints[i]).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5));
                dummy.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
                dummy.updateMatrix();
                instancedLeaves.setMatrixAt(leafIndex++, dummy.matrix);
            }
        }
        treeGroup.add(instancedLeaves);
    }
    createRootSystem(new THREE.Vector3(x, 0, z), 12, 16, 0.4);
}

function createRootSystem(startPoint, initialBranches, depth, initialRadius) {
    for (let i = 0; i < initialBranches; i++) {
        let currentPoint = startPoint.clone();
        let currentRadius = initialRadius;
        let direction = new THREE.Vector3((Math.random() - 0.5) * 1.5, -Math.random() * 1.0 - 0.5, (Math.random() - 0.5) * 1.5).normalize();
        for (let j = 0; j < depth; j++) {
            const length = Math.random() * 4 + 3;
            const nextPoint = currentPoint.clone().add(direction.clone().multiplyScalar(length));
            const geometry = new THREE.CylinderGeometry(currentRadius, currentRadius * 0.8, length, 5);
            const segment = new THREE.Mesh(geometry, networkMaterial);
            segment.position.copy(currentPoint.clone().add(nextPoint).divideScalar(2));
            segment.lookAt(nextPoint);
            segment.rotateX(Math.PI / 2);
            segment.userData.isLearned = false;
            rootNetwork.add(segment);
            currentPoint = nextPoint;
            currentRadius *= 0.85;
            direction.x += (Math.random() - 0.5) * 0.8;
            direction.z += (Math.random() - 0.5) * 0.8;
            direction.normalize();
            if (Math.random() > 0.6 && j < depth - 2) {
                createRootSystem(currentPoint, 1, depth - j - 1, currentRadius * 0.8);
            }
        }
    }
}

function triggerSparkle(position) {
    const sparkle = sparklePool.find(s => !s.visible);
    if (sparkle) {
        sparkle.position.copy(position);
        sparkle.material.opacity = 1.0;
        sparkle.visible = true;
        sparkle.userData.life = 1.0;
    }
}

function resetAnimationState() {
    blueRootIndices = [];
    rootNetwork.children.forEach((child, index) => {
        child.material = networkMaterial;
        child.userData.isLearned = false;
        blueRootIndices.push(index);
    });
    totalRoots = rootNetwork.children.length;
    learnedCount = 0;
    stateTimer = 0;
    animationState = 'RUNNING';
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    const CONVERSION_RATE = Math.ceil(totalRoots / 10 / 60) || 1;
    const GOAL_PERCENTAGE = 0.1, PAUSE_DURATION = 3;

    // --- Update world objects ---
    const lightOffset = new THREE.Vector3(30, 50, 30);
    lightOffset.applyQuaternion(camera.quaternion);
    if (directionalLight) {
        directionalLight.position.copy(camera.position).add(lightOffset);
        const polarAngle = controls.getPolarAngle();
        directionalLight.intensity = 1.0 + Math.sin(polarAngle) * 2.0;
    }

    rootNetwork.children.forEach(segment => {
        if (!segment.userData.isLearned) {
            const material = segment.material;
            const baseOpacity = material.userData.baseOpacity || 0.3;
            material.opacity = baseOpacity + Math.sin(elapsedTime * 0.5 + segment.position.x * 0.1) * (baseOpacity * 0.5);
        }
    });
    
    sparklePool.forEach(sparkle => {
        if (sparkle.visible) {
            sparkle.userData.life -= delta * 2;
            sparkle.material.opacity = sparkle.userData.life;
            if (sparkle.userData.life <= 0) sparkle.visible = false;
        }
    });

    // --- State Machine Logic with Debugging ---
    stateTimer += delta;

    if (animationState === 'RUNNING') {
        const goalReached = learnedCount >= (totalRoots * GOAL_PERCENTAGE);
        // console.log(`${learnedCount} ===> ${totalRoots} ===> ${goalReached}`); // DEBUG
        if (totalRoots > 0 && (blueRootIndices.length === 0 || goalReached)) {
            // console.log("Goal reached or roots empty. Changing to PAUSED."); // DEBUG
            animationState = 'PAUSED';
            stateTimer = 0;
        } else {
            // Keep converting roots...
            for (let i = 0; i < CONVERSION_RATE; i++) {
                if (blueRootIndices.length > 0) {
                    const randomIndex = Math.floor(Math.random() * blueRootIndices.length);
                    const rootIndexToConvert = blueRootIndices.splice(randomIndex, 1)[0];
                    const segment = rootNetwork.children[rootIndexToConvert];
                    if (segment) {
                        segment.material = learnedMaterial;
                        segment.userData.isLearned = true;
                        triggerSparkle(segment.position);
                        learnedCount++;
                    }
                }
            }
        }
    } else if (animationState === 'PAUSED') {
        // console.log(`PAUSED: Timer is ${stateTimer.toFixed(2)}s`); // DEBUG
        if (stateTimer > PAUSE_DURATION) {
            // console.log("Pause finished. Triggering reset."); // DEBUG
            resetAnimationState();
        }
    } else if (animationState === 'IDLE') {
        // console.log("State is IDLE. Triggering initial reset."); // DEBUG
        resetAnimationState();
    }
    // console.log(`stateTimer: ${stateTimer.toFixed(2)}s, Current State: ${animationState}, Learned Count: ${learnedCount}, Total Roots: ${totalRoots}`); // DEBUG
    
    controls.update();
    composer.render();
}


// --- Main Control Functions ---

function initForestAnimation() {
    if (animationFrameId) {
        stopForestAnimation();
    }

    const container = document.getElementById('forest-animation-container');
    if (!container) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85);
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- Add these two lines back ---
    controls.autoRotate = true;
    controls.autoRotateSpeed = 4; // You can adjust this speed

    directionalLight = new THREE.DirectionalLight(0xffe8b5, 3.0);
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0x404040, 1.5));
    scene.add(new THREE.HemisphereLight(0x3d506b, 0x080820, 1.5));

    networkMaterial = new THREE.MeshBasicMaterial({ color: 0x87cefa, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
    networkMaterial.userData.baseOpacity = 0.3;
    learnedMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.5, side: THREE.DoubleSide });

    rootNetwork = new THREE.Group();
    scene.add(rootNetwork);

    createMajesticTree(-60, -40);
    createMajesticTree(50, -60);
    createMajesticTree(0, 0);
    createMajesticTree(80, 20);
    createMajesticTree(-30, 50);

    const SPARKLE_COUNT = 50;
    for (let i = 0; i < SPARKLE_COUNT; i++) {
        const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        sparkle.visible = false;
        sparkle.userData.life = 0;
        scene.add(sparkle);
        sparklePool.push(sparkle);
    }
    
    resetAnimationState();

    onWindowResize = () => {
        if (!renderer) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        composer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onWindowResize);

    camera.position.set(0, 20, 180);
    controls.target.set(0, -15, 0);

    animate();
}

function stopForestAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (onWindowResize) {
        window.removeEventListener('resize', onWindowResize);
        onWindowResize = null;
    }

    if (renderer) {
        if (scene) {
            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => {
                        Object.values(material).forEach(value => {
                            if (value && typeof value.dispose === 'function') {
                                value.dispose();
                            }
                        });
                        material.dispose();
                    });
                }
            });
            while (scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }
        }

        renderer.dispose();
        if (controls) controls.dispose();

        const canvas = renderer.domElement;
        if (canvas && canvas.parentElement) {
            canvas.parentElement.removeChild(canvas);
        }
    }

    // Clear all global state
    renderer = scene = camera = controls = composer = directionalLight = rootNetwork = onWindowResize = null;
    sparklePool = [];
    // clock.stop();
}

window.initForestAnimation = initForestAnimation;
window.stopForestAnimation = stopForestAnimation;