import * as THREE from 'three';

/**
 * Creates a simple, empty, circular planter pot mesh.
 * Uses LatheGeometry to create a curved profile.
 */
export function createPlanterPot(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    color: THREE.ColorRepresentation = 0xA0522D // Sienna color
): THREE.Mesh {

    // Define the shape profile for the lathe
    const points = [];
    const radiusTop = 0.4;
    const radiusBottom = 0.3;
    const height = 0.5;
    const wallThickness = 0.05; // Thickness of the pot wall

    // Outer profile
    points.push(new THREE.Vector2(radiusBottom, 0));
    points.push(new THREE.Vector2(radiusTop, height));

    // Inner profile (slightly smaller radius, slightly higher bottom)
    const innerRadiusTop = radiusTop - wallThickness;
    const innerRadiusBottom = radiusBottom - wallThickness;
    const innerHeight = height - wallThickness; // Top edge is open
    const innerBottomY = wallThickness; // Bottom is slightly raised

    points.push(new THREE.Vector2(innerRadiusTop, height)); // Top inner edge
    points.push(new THREE.Vector2(innerRadiusTop, innerBottomY)); // Bottom inner edge start
    points.push(new THREE.Vector2(innerRadiusBottom, innerBottomY)); // Bottom inner edge end
    points.push(new THREE.Vector2(radiusBottom, 0)); // Connect back to start

    // Create geometry by rotating the points around the Y axis
    const geometry = new THREE.LatheGeometry(points, 16); // 16 segments for smoothness

    const material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide // Render both sides
    });

    const potMesh = new THREE.Mesh(geometry, material);
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    potMesh.position.copy(position);
    potMesh.name = "planterPot";

    return potMesh;
}