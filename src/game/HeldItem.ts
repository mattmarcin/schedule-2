import * as THREE from 'three';

// Define item types
export type HeldItemType = 'soil' | 'wateringCan' | 'seedVial' | 'none';

/**
 * Creates a simple mesh representing a held item.
 * This should be attached to the camera.
 */
export function createHeldItemMesh(
    type: HeldItemType = 'none'
): THREE.Mesh | null {

    if (type === 'none') {
        return null;
    }

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let mesh: THREE.Mesh;

    switch (type) {
        case 'soil':
            geometry = new THREE.BoxGeometry(0.2, 0.3, 0.15);
            material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
            mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.set(0, -0.3, 0.1); // Slight rotation
            break;

        case 'wateringCan':
            // Simple grey cylinder for watering can body
            geometry = new THREE.CylinderGeometry(0.1, 0.12, 0.25, 16); // radiusTop, radiusBottom, height, segments
            material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa }); // Grey
            mesh = new THREE.Mesh(geometry, material);
            // Add a simple spout (thin cylinder) - more complex shapes later if needed
            const spoutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
            const spoutMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
            const spoutMesh = new THREE.Mesh(spoutGeo, spoutMat);
            spoutMesh.position.set(0.1, 0.05, 0); // Position relative to can body center
            spoutMesh.rotation.set(0, 0, -Math.PI / 4); // Angle the spout
            mesh.add(spoutMesh); // Add spout as child
            // Rotate 90 degrees left (around Y) + slight adjustments for view
            mesh.rotation.set(0.1, Math.PI / 2 - 0.2, -0.1);
            break;

        case 'seedVial':
            // Small, thin cylinder for vial
            geometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 12);
            // Make it slightly transparent (like glass)
            material = new THREE.MeshStandardMaterial({
                color: 0xe0ffff, // Light cyan/white
                transparent: true,
                opacity: 0.7
            });
            mesh = new THREE.Mesh(geometry, material);
            // Add a tiny sphere inside for the seed
            const seedGeo = new THREE.SphereGeometry(0.015, 8, 8);
            const seedMat = new THREE.MeshBasicMaterial({ color: 0x3A2414 }); // Dark brown seed
            const seedMesh = new THREE.Mesh(seedGeo, seedMat);
            seedMesh.position.y = -0.04; // Position seed near bottom
            mesh.add(seedMesh);
            mesh.rotation.set(0, 0, 0.1); // Slight tilt
            break;

        default:
            return null;
    }

    mesh.name = "heldItem";
    mesh.castShadow = true; // Item can cast shadow

    // Common position relative to camera (adjust these values)
    mesh.position.set(0.3, -0.3, -0.5); // Right, down, forward from camera center

    return mesh;
}