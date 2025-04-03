import * as THREE from 'three';

export class SceneManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;

    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;

    constructor() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Basic sky blue, will be replaced by skybox

        // Camera
        const fov = 75; // Field of View
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1; // Near clipping plane
        const far = 1000; // Far clipping plane
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, 1.6, 5); // Position slightly above ground, looking forward

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true; // Enable shadows
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Simulate sunlight
        this.directionalLight.position.set(5, 10, 7.5);
        this.directionalLight.castShadow = true;
        // Configure shadow properties if needed (optional for now)
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.scene.add(this.directionalLight);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    public onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }
}