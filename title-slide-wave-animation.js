import * as THREE from 'three';
/**
 * title-slide-wave-animation.js
 * * This module encapsulates the Three.js ripple animation for the title slide.
 * It exposes two main methods:
 * - start(): Initializes and starts the animation.
 * - stop(): Stops the animation and cleans up resources to save memory.
 */


    // --- Private variables ---
    let scene, camera, renderer, particles;
    let animationFrameId;
    let particleSystem = []; 
    let impactCenter = new THREE.Vector3();
    let clock;

    // --- Animation Parameters ---
    const gridWidth = 100;
    const gridHeight = 60;
    const particleSpacing = 20;
    const waveSpeed = 4;
    const waveLength = 80;
    const waveAmplitude = 25;

    // --- Particle Colors ---
    const baseColor = new THREE.Color("#D1D5DB"); // Gray
    // const waveCrestColor = new THREE.Color("#F97316"); // Railse Orange
    const waveCrestColor = new THREE.Color("#3B82F6"); // Railse Blue

    /**
     * Initializes the Three.js scene, camera, renderer, and particles.
     */
    function initThreeJS() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) {
            console.error("Canvas element #bg-canvas not found.");
            return;
        }

        clock = new THREE.Clock();
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        camera.position.z = window.innerHeight / (2 * Math.tan(vFOV / 2));

        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // Calculate the precise offset for the logo
        const logoElement = document.getElementById('logo-img');
        if (!logoElement) {
            console.error("Logo element #logo-img not found.");
            return;
        }
        const logoRect = logoElement.getBoundingClientRect();
        
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;

        impactCenter.x = logoCenterX - screenCenterX;
        impactCenter.y = -(logoCenterY - screenCenterY);
        impactCenter.z = 0;

        // Particle System
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(gridWidth * gridHeight * 3);
        const colors = new Float32Array(gridWidth * gridHeight * 3);
        
        let i = 0;
        particleSystem = []; // Clear previous system
        for (let ix = 0; ix < gridWidth; ix++) {
            for (let iy = 0; iy < gridHeight; iy++) {
                const i3 = i * 3;
                
                const x = ix * particleSpacing - (gridWidth * particleSpacing) / 2;
                const y = iy * particleSpacing - (gridHeight * particleSpacing) / 2;
                
                positions[i3] = x;
                positions[i3 + 1] = y;
                positions[i3 + 2] = -200;
                
                baseColor.toArray(colors, i3);

                particleSystem.push({
                    originalX: x,
                    originalY: y,
                    originalZ: -200
                });
                i++;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        camera.position.z = window.innerHeight / (2 * Math.tan(vFOV / 2));
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        const positions = particles.geometry.attributes.position;
        const colors = particles.geometry.attributes.color;
        const time = clock.getElapsedTime();

        let i = 0;
        for (let ix = 0; ix < gridWidth; ix++) {
            for (let iy = 0; iy < gridHeight; iy++) {
                const particleData = particleSystem[i];
                const i3 = i * 3;
                
                const dx = particleData.originalX - impactCenter.x;
                const dy = particleData.originalY - impactCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const ripple = Math.sin(distance / waveLength - time * waveSpeed);
                const dampening = 1 / (1 + distance / 200);
                
                // --- MODIFIED: Displacement is now only applied to the Y-axis ---
                const displacement = ripple * waveAmplitude * dampening;
                const newY = particleData.originalY + displacement;
                
                // The Z position remains constant for a smoother look
                positions.setXYZ(i, particleData.originalX, newY, particleData.originalZ);

                const colorFactor = (ripple + 1) / 2;
                const mixedColor = baseColor.clone().lerp(waveCrestColor, colorFactor);
                mixedColor.toArray(colors.array, i3);
                
                i++;
            }
        }
        
        positions.needsUpdate = true;
        colors.needsUpdate = true;

        renderer.render(scene, camera);
    }

    // --- Public methods exported for global use ---
    export const TitleSlideAnimation = {
        /**
         * Starts the animation. Should be called when the slide becomes visible.
         */
        start: function() {
            if (animationFrameId) return; // Already running
            try {
                // A short delay to ensure the logo position is calculated correctly
                setTimeout(() => {
                    initThreeJS();
                    animate();
                }, 100);
            } catch (error) {
                console.error("Could not initialize animation:", error);
                const canvas = document.getElementById('bg-canvas');
                if(canvas) canvas.style.display = 'none';
            }
        },

        /**
         * Stops the animation and cleans up. Should be called when the slide is hidden.
         */
        stop: function() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Clean up Three.js resources to free memory
            if (scene) {
                scene.traverse(object => {
                    if (object.isMesh || object.isPoints) {
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                    }
                });
                scene = null;
            }
            if (renderer) {
                renderer.dispose();
                renderer = null;
            }
            window.removeEventListener('resize', onWindowResize);
        }
    };

// To make it available on the window object like before
window.TitleSlideAnimation = TitleSlideAnimation;