// forest-ecosystem-animation.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Global variables to manage the animation state
let animationFrameId;
let renderer, composer, controls;
let scene; 
let onWindowResize; // <-- ADD THIS LINE

function initForestAnimation() {
    // Stop any previous instance to prevent duplicates
    if (animationFrameId) {
        stopForestAnimation();
    }

    const container = document.getElementById('forest-animation-container');
    if (!container) {
        console.error('Forest animation container not found!');
        return;
    }

    // --- Core Scene Setup ---
    scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Post-processing (Bloom) ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 0.6;
    bloomPass.radius = 0.5;
    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // --- Controls ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI * 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 4.0;

    // --- Lighting ---
    const directionalLight = new THREE.DirectionalLight(0xffe8b5, 3.0);
    directionalLight.position.set(0, 50, 0);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0x3d506b, 0x080820, 1.5);
    scene.add(hemisphereLight);

    // --- Materials ---
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.8, side: THREE.DoubleSide });
    const networkMaterial = new THREE.MeshBasicMaterial({
        color: 0x87cefa,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    networkMaterial.userData.baseOpacity = 0.3;
    const learnedMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1.5,
        side: THREE.DoubleSide
    });

    // --- Majestic Tree Generation ---
    const rootNetwork = new THREE.Group();
    scene.add(rootNetwork);

    function createMajesticTree(x, z) {
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
                const turnFactor = depth > 5 ? 0.8 : 1.8;
                let newDirection = direction.clone().applyEuler(new THREE.Euler((Math.random() - 0.5) * turnFactor, (Math.random() - 0.5) * turnFactor, (Math.random() - 0.5) * turnFactor)).applyEuler(sway);
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
                const segment = new THREE.Mesh(geometry, networkMaterial.clone());
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
        
    createMajesticTree(-60, -40);
    createMajesticTree(50, -60);
    createMajesticTree(0, 0);
    createMajesticTree(80, 20);
    createMajesticTree(-30, 50);
        
    // --- Firefly Cascade Animation ---
    let blueRootIndices = [], learnedCount = 0, totalRoots = rootNetwork.children.length;
    let animationState = 'IDLE', stateTimer = 0;
    const CONVERSION_RATE = Math.ceil(totalRoots / 10 / 60);
    const GOAL_PERCENTAGE = 0.1, PAUSE_DURATION = 3;
    const sparklePool = [], SPARKLE_COUNT = 50;
    for(let i = 0; i < SPARKLE_COUNT; i++) {
        const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        sparkle.visible = false;
        sparkle.userData.life = 0;
        scene.add(sparkle);
        sparklePool.push(sparkle);
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
    function resetAnimation() {
        blueRootIndices = [];
        rootNetwork.children.forEach((child, index) => {
            child.material = networkMaterial; // <-- REUSE material, DON'T CLONE
            child.userData.isLearned = false;
            blueRootIndices.push(index);
        });
        learnedCount = 0;
        stateTimer = 0;
        animationState = 'RUNNING';
    }

    const clock = new THREE.Clock();
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta(), elapsedTime = clock.getElapsedTime();
        const lightOffset = new THREE.Vector3(30, 50, 30);
        lightOffset.applyQuaternion(camera.quaternion);
        directionalLight.position.copy(camera.position).add(lightOffset);
        const polarAngle = controls.getPolarAngle();
        directionalLight.intensity = 1.0 + Math.sin(polarAngle) * 2.0;
        rootNetwork.children.forEach(segment => {
            if(!segment.userData.isLearned) {
                const material = segment.material;
                const baseOpacity = material.userData.baseOpacity || 0.3;
                material.opacity = baseOpacity + Math.sin(elapsedTime * 0.5 + segment.position.x * 0.1) * (baseOpacity * 0.5);
            }
        });
        sparklePool.forEach(sparkle => {
            if (sparkle.visible) {
                sparkle.userData.life -= delta * 2;
                if (sparkle.userData.life <= 0) sparkle.visible = false;
                else sparkle.material.opacity = sparkle.userData.life;
            }
        });
        stateTimer += delta;
        if (animationState === 'IDLE') resetAnimation();
        if (animationState === 'RUNNING') {
            for (let i = 0; i < CONVERSION_RATE; i++) {
                if (blueRootIndices.length > 0 && (learnedCount / totalRoots) < GOAL_PERCENTAGE) {
                    const randomIndex = Math.floor(Math.random() * blueRootIndices.length);
                    const rootIndexToConvert = blueRootIndices.splice(randomIndex, 1)[0];
                    const segment = rootNetwork.children[rootIndexToConvert];
                    segment.material = learnedMaterial; // <-- REUSE material, DON'T CLONE
                    segment.userData.isLearned = true;
                    triggerSparkle(segment.position);
                    learnedCount++;
                } else {
                    animationState = 'PAUSED';
                    stateTimer = 0;
                    break;
                }
            }
        }
        if (animationState === 'PAUSED' && stateTimer > PAUSE_DURATION) animationState = 'IDLE';
        controls.update();
        composer.render();
    }
    
    onWindowResize = () => { // <-- Assign the function to our variable
        if (!renderer) return; // Prevent errors if resize happens after cleanup
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        composer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onWindowResize); // <-- Add the listener

    camera.position.set(0, 20, 180);
    controls.target.set(0, -15, 0);
    
    resetAnimation();
    animate();
}

function stopForestAnimation() {
    // --- 1. REMOVE THE EVENT LISTENER --- ✅
    if (onWindowResize) {
        window.removeEventListener('resize', onWindowResize);
        onWindowResize = null; // Clear the reference
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (renderer) {
        // --- UPDATED & MORE THOROUGH CLEANUP ---
        if (scene) {
            // Traverse the entire scene graph to dispose of everything
            scene.traverse(object => {
                // Also dispose of any textures on materials
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
                if (object.geometry) {
                    object.geometry.dispose();
                }
            });
            // Remove all children from the scene
            while(scene.children.length > 0){ 
                scene.remove(scene.children[0]); 
            }
        }
        
        // Dispose of the renderer and controls
        renderer.dispose();
        if (controls) controls.dispose();
        
        const canvas = renderer.domElement;
        if (canvas && canvas.parentElement) {
            canvas.parentElement.removeChild(canvas);
        }

        // Clear all global references to allow for garbage collection
        renderer = null;
        composer = null;
        controls = null;
        scene = null;
    }
}

// Make functions globally available
window.initForestAnimation = initForestAnimation;
window.stopForestAnimation = stopForestAnimation;