import * as THREE from 'three';

// Private variables to hold the single instance
let rendererInstance = null;

/**
 * Manages a single WebGLRenderer instance for the entire application
 * to prevent WebGL context exhaustion.
 */
export const WebGLManager = {
    /**
     * Gets the shared WebGLRenderer instance. Creates it if it doesn't exist.
     * @returns {THREE.WebGLRenderer} The singleton renderer instance.
     */
    getRenderer: () => {
        if (!rendererInstance) {
            // --- Create the renderer
            rendererInstance = new THREE.WebGLRenderer({ 
                antialias: true, 
                powerPreference: 'high-performance' 
            });
            rendererInstance.setPixelRatio(window.devicePixelRatio);
            rendererInstance.setClearColor(0x000000, 1); // Black background
        }
        return rendererInstance;
    },

    // New function to attach the canvas to a specific container
    attach: (container) => {
        if (rendererInstance) {
            rendererInstance.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(rendererInstance.domElement);
        }
    },

    // New function to detach the canvas
    detach: () => {
        if (rendererInstance && rendererInstance.domElement.parentElement) {
            rendererInstance.domElement.parentElement.removeChild(rendererInstance.domElement);
        }
    }
};