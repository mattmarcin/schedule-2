import * as THREE from 'three';

export class Ground {
    public grassMesh: THREE.Mesh;
    public roadMesh: THREE.Mesh;
    public roadMarkings: THREE.Group; // Group to hold all dashes
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        const groundSize = 100; // How large the ground plane is
        const roadWidth = 6; // Width of the road

        // --- Grass ---
        const grassGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22, // Forest Green color
            side: THREE.DoubleSide,
        });
        this.grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
        this.grassMesh.rotation.x = -Math.PI / 2;
        this.grassMesh.receiveShadow = true;
        this.grassMesh.position.y = 0;
        this.scene.add(this.grassMesh);

        // --- Road ---
        const roadGeometry = new THREE.PlaneGeometry(roadWidth, groundSize); // Long and narrow
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444, // Dark grey color for asphalt
            side: THREE.DoubleSide,
        });
        this.roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
        this.roadMesh.rotation.x = -Math.PI / 2;
        this.roadMesh.receiveShadow = true;
        this.roadMesh.position.y = 0.01; // Position road slightly above grass
        this.roadMesh.position.x = 0; // Center the road
        this.scene.add(this.roadMesh);

        // --- Road Markings (Dashed Lines) ---
        this.roadMarkings = new THREE.Group();
        const dashLength = 1.5;
        const dashWidth = 0.15;
        const dashGap = 1.0; // Gap between dashes
        const numberOfDashes = Math.floor(groundSize / (dashLength + dashGap));
        const startZ = -groundSize / 2 + dashLength / 2; // Starting position for the first dash

        const dashGeometry = new THREE.PlaneGeometry(dashWidth, dashLength); // Note: width/length swapped for rotation
        const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White, basic material (no lighting needed)

        for (let i = 0; i < numberOfDashes; i++) {
            const dashMesh = new THREE.Mesh(dashGeometry, dashMaterial);
            dashMesh.rotation.x = -Math.PI / 2; // Rotate flat like the road
            // Position slightly above the road to prevent z-fighting
            dashMesh.position.y = 0.02;
            // Position along the center line (x=0) with gaps
            dashMesh.position.z = startZ + i * (dashLength + dashGap);
            this.roadMarkings.add(dashMesh);
        }
        this.scene.add(this.roadMarkings);
    }
}