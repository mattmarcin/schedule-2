import * as THREE from 'three';

// Pot dimensions
const radiusTop = 0.4;
const radiusBottom = 0.3;
const height = 0.5;
const wallThickness = 0.05;
const innerRadiusTop = radiusTop - wallThickness;
const innerBottomY = wallThickness;
const soilHeightRatio = 0.8; // How full the pot is with soil

// Soil colors
const DRY_SOIL_COLOR = 0x5C4033;
const WET_SOIL_COLOR = 0x402E26; // Darker brown for wet soil

/**
 * Creates a simple, empty, circular planter pot mesh.
 */
export function createPlanterPot(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    color: THREE.ColorRepresentation = 0xA0522D // Sienna color
): THREE.Mesh {

    const points = [];
    points.push(new THREE.Vector2(radiusBottom, 0));
    points.push(new THREE.Vector2(radiusTop, height));
    const innerRadiusBottom = radiusBottom - wallThickness;
    points.push(new THREE.Vector2(innerRadiusTop, height));
    points.push(new THREE.Vector2(innerRadiusTop, innerBottomY));
    points.push(new THREE.Vector2(innerRadiusBottom, innerBottomY));
    points.push(new THREE.Vector2(radiusBottom, 0));

    const geometry = new THREE.LatheGeometry(points, 16);
    const material = new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide });

    const potMesh = new THREE.Mesh(geometry, material);
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    potMesh.position.copy(position);
    potMesh.name = "planterPot";
    potMesh.userData = {
        hasSoil: false,
        isWatered: false,
        hasSeed: false, // Add seed state
        interactable: true
    };

    return potMesh;
}

/**
 * Adds a soil mesh inside a given planter pot mesh.
 */
export function addSoilToPot(potMesh: THREE.Mesh): boolean {
    if (!potMesh || potMesh.name !== "planterPot" || potMesh.userData.hasSoil) {
        console.warn("Cannot add soil to this object or it already has soil.");
        return false;
    }

    const soilHeight = (height - innerBottomY) * soilHeightRatio;
    const soilRadius = innerRadiusTop * 0.98;
    const soilGeometry = new THREE.CylinderGeometry(soilRadius, soilRadius, soilHeight, 16);
    const soilMaterial = new THREE.MeshStandardMaterial({ color: DRY_SOIL_COLOR, side: THREE.DoubleSide });
    const soilMesh = new THREE.Mesh(soilGeometry, soilMaterial);
    soilMesh.position.y = innerBottomY + soilHeight / 2; // Position soil on inner bottom
    soilMesh.name = "potSoil";
    soilMesh.castShadow = true;
    soilMesh.receiveShadow = true;

    potMesh.add(soilMesh);
    potMesh.userData.hasSoil = true;
    console.log("Soil added to pot:", potMesh.uuid);
    return true;
}

/**
 * Waters the soil in a given planter pot mesh.
 */
export function waterPotSoil(potMesh: THREE.Mesh): boolean {
    if (!potMesh || potMesh.name !== "planterPot" || !potMesh.userData.hasSoil || potMesh.userData.isWatered) {
        console.warn("Cannot water this pot: No soil or already watered.");
        return false;
    }

    const soilMesh = potMesh.getObjectByName("potSoil") as THREE.Mesh;
    if (!soilMesh || !(soilMesh.material instanceof THREE.MeshStandardMaterial)) {
        console.error("Soil mesh or material not found in pot.");
        return false;
    }

    soilMesh.material.color.setHex(WET_SOIL_COLOR);
    potMesh.userData.isWatered = true;
    console.log("Pot watered:", potMesh.uuid);
    return true;
}

/**
 * Adds a seed mesh to the soil in a planter pot.
 */
export function addSeedToPot(potMesh: THREE.Mesh): boolean {
    if (!potMesh || potMesh.name !== "planterPot" || !potMesh.userData.hasSoil || !potMesh.userData.isWatered || potMesh.userData.hasSeed) {
        console.warn("Cannot add seed: Pot needs watered soil or already has a seed.");
        return false;
    }

    const soilMesh = potMesh.getObjectByName("potSoil") as THREE.Mesh;
    if (!soilMesh) {
        console.error("Soil mesh not found in pot when adding seed.");
        return false;
    }

    // Simple green sphere for the seed
    const seedRadius = 0.03;
    const seedGeometry = new THREE.SphereGeometry(seedRadius, 8, 8);
    const seedMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Bright green

    const seedMesh = new THREE.Mesh(seedGeometry, seedMaterial);
    // Position seed on top center of the soil mesh
    const soilHeight = (height - innerBottomY) * soilHeightRatio;
    seedMesh.position.y = innerBottomY + soilHeight + seedRadius * 0.5; // Place just above soil surface
    seedMesh.position.x = 0; // Center horizontally
    seedMesh.position.z = 0; // Center depth-wise
    seedMesh.name = "potSeed";
    seedMesh.castShadow = true;

    // Add seed as a child of the pot (or soil mesh, depending on preference)
    potMesh.add(seedMesh);
    potMesh.userData.hasSeed = true; // Update state
    console.log("Seed added to pot:", potMesh.uuid);
    return true;
}