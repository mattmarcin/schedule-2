import * as THREE from 'three';

export class Skybox {
    private scene: THREE.Scene;
    private loader: THREE.CubeTextureLoader;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.loader = new THREE.CubeTextureLoader();

        // Define the path to the skybox textures directory
        // IMPORTANT: Ensure you have 6 images (posx, negx, posy, negy, posz, negz)
        // in the 'public/textures/skybox/' directory.
        // The '.jpg' extension is assumed here; change if your images use a different format.
        const texturePath = '/textures/skybox/'; // Path relative to the 'public' directory
        const textureUrls = [
            texturePath + 'posx.jpg', // Right
            texturePath + 'negx.jpg', // Left
            texturePath + 'posy.jpg', // Top
            texturePath + 'negy.jpg', // Bottom
            texturePath + 'posz.jpg', // Front
            texturePath + 'negz.jpg', // Back
        ];

        // Load the cube texture
        const cubeTexture = this.loader.load(textureUrls,
            () => {
                console.log('Skybox textures loaded successfully.');
                // Apply the texture as the scene background
                this.scene.background = cubeTexture;
            },
            undefined, // onProgress callback (optional)
            (error) => {
                console.error('An error occurred loading the skybox textures:', error);
                // Keep the default blue background if loading fails
            }
        );
    }
}