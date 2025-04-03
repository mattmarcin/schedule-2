import * as THREE from 'three';

// Pot dimensions
const radiusTop = 0.4;
const radiusBottom = 0.3;
const height = 0.5;
const wallThickness = 0.05;
const innerRadiusTop = radiusTop - wallThickness;
const innerBottomY = wallThickness;
const soilHeightRatio = 0.8;
const soilTopY = innerBottomY + (height - innerBottomY) * soilHeightRatio;

// Soil colors
const DRY_SOIL_COLOR = 0x5C4033;
const WET_SOIL_COLOR = 0x402E26;

// Growth times (in milliseconds)
const GROWTH_STAGE_1_TIME = 5 * 1000; // 5 seconds
const GROWTH_STAGE_2_TIME = 20 * 1000; // 20 seconds (maturity)

// Plant colors
const LEAF_COLOR = 0x008000; // Green
const STALK_COLOR = 0x228B22; // Forest Green

/**
 * Creates a simple, empty, circular planter pot mesh.
 */
export function createPlanterPot(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    color: THREE.ColorRepresentation = 0xA0522D
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
        hasSeed: false,
        growthStartTime: null as number | null, // Track when growth started
        currentGrowthStage: 0, // 0: none, 1: sprout, 2: mature
        isMature: false,
        plantMesh: null as THREE.Group | null, // Reference to the plant model
        interactable: true
    };
    return potMesh;
}

/** Adds soil mesh */
export function addSoilToPot(potMesh: THREE.Mesh): boolean {
    if (!potMesh || potMesh.name !== "planterPot" || potMesh.userData.hasSoil) return false;
    const soilHeight = (height - innerBottomY) * soilHeightRatio;
    const soilRadius = innerRadiusTop * 0.98;
    const soilGeometry = new THREE.CylinderGeometry(soilRadius, soilRadius, soilHeight, 16);
    const soilMaterial = new THREE.MeshStandardMaterial({ color: DRY_SOIL_COLOR, side: THREE.DoubleSide });
    const soilMesh = new THREE.Mesh(soilGeometry, soilMaterial);
    soilMesh.position.y = innerBottomY + soilHeight / 2;
    soilMesh.name = "potSoil";
    soilMesh.castShadow = true;
    soilMesh.receiveShadow = true;
    potMesh.add(soilMesh);
    potMesh.userData.hasSoil = true;
    return true;
}

/** Waters the soil */
export function waterPotSoil(potMesh: THREE.Mesh): boolean {
    if (!potMesh || !potMesh.userData.hasSoil || potMesh.userData.isWatered) return false;
    const soilMesh = potMesh.getObjectByName("potSoil") as THREE.Mesh;
    if (!soilMesh || !(soilMesh.material instanceof THREE.MeshStandardMaterial)) return false;
    soilMesh.material.color.setHex(WET_SOIL_COLOR);
    potMesh.userData.isWatered = true;
    return true;
}

/** Adds a seed and starts the growth timer */
export function addSeedToPot(potMesh: THREE.Mesh): boolean {
    if (!potMesh || !potMesh.userData.hasSoil || !potMesh.userData.isWatered || potMesh.userData.hasSeed) return false;
    // Don't add a visual seed mesh anymore, just start the timer
    potMesh.userData.hasSeed = true;
    potMesh.userData.growthStartTime = Date.now(); // Record start time
    potMesh.userData.currentGrowthStage = 0; // Ensure starting at stage 0
    console.log("Seed planted, growth started:", potMesh.uuid);
    return true;
}

// --- Plant Growth ---

function createPlantStage1(): THREE.Group {
    const group = new THREE.Group();
    group.name = "plantMesh";
    // Single small leaf (e.g., a flat plane or simple shape)
    const leafGeo = new THREE.PlaneGeometry(0.1, 0.15);
    const leafMat = new THREE.MeshStandardMaterial({ color: LEAF_COLOR, side: THREE.DoubleSide });
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.rotation.x = -Math.PI / 4; // Angle it slightly
    leafMesh.position.y = 0.05; // Slightly above soil
    group.add(leafMesh);
    return group;
}

function createPlantStage2(): THREE.Group {
    const group = new THREE.Group();
    group.name = "plantMesh";
    const stalkHeight = 0.4;
    const stalkRadius = 0.02;

    // Central stalk
    const stalkGeo = new THREE.CylinderGeometry(stalkRadius, stalkRadius, stalkHeight, 8);
    const stalkMat = new THREE.MeshStandardMaterial({ color: STALK_COLOR });
    const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
    stalkMesh.position.y = stalkHeight / 2; // Base at y=0 relative to group
    group.add(stalkMesh);

    // 5 leaves around the top
    const leafGeo = new THREE.PlaneGeometry(0.15, 0.2);
    const leafMat = new THREE.MeshStandardMaterial({ color: LEAF_COLOR, side: THREE.DoubleSide });
    const numLeaves = 5;
    for (let i = 0; i < numLeaves; i++) {
        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        const angle = (i / numLeaves) * Math.PI * 2;
        leafMesh.position.set(
            Math.cos(angle) * 0.05, // Offset from stalk center
            stalkHeight * 0.8,      // Position near top of stalk
            Math.sin(angle) * 0.05
        );
        leafMesh.rotation.set(-Math.PI / 3, angle + Math.PI / 2, 0); // Angle outwards
        group.add(leafMesh);
    }
    return group;
}

/** Updates the plant visual based on elapsed time */
export function updatePlantGrowth(potMesh: THREE.Mesh, currentTime: number): void {
    const data = potMesh.userData;
    if (!data.hasSeed || data.isMature || data.growthStartTime === null) {
        return; // Not growing or already finished
    }

    const elapsedTime = currentTime - data.growthStartTime;
    let targetStage = 0;
    if (elapsedTime >= GROWTH_STAGE_2_TIME) {
        targetStage = 2;
    } else if (elapsedTime >= GROWTH_STAGE_1_TIME) {
        targetStage = 1;
    }

    if (targetStage > data.currentGrowthStage) {
        console.log(`Pot ${potMesh.uuid} growing to stage ${targetStage}`);
        // Remove previous plant mesh if it exists
        if (data.plantMesh) {
            potMesh.remove(data.plantMesh);
            // TODO: Dispose geometry/material if needed
            data.plantMesh = null;
        }

        // Create and add new plant mesh
        let newPlantMesh: THREE.Group | null = null;
        if (targetStage === 1) {
            newPlantMesh = createPlantStage1();
        } else if (targetStage === 2) {
            newPlantMesh = createPlantStage2();
            data.isMature = true; // Mark as mature
            console.log(`Pot ${potMesh.uuid} is mature!`);
        }

        if (newPlantMesh) {
            // Position plant on top of soil
            newPlantMesh.position.y = soilTopY;
            potMesh.add(newPlantMesh);
            data.plantMesh = newPlantMesh;
        }
        data.currentGrowthStage = targetStage;
    }
}

/** Resets the pot to an empty state */
export function resetPot(potMesh: THREE.Mesh): void {
    if (!potMesh || potMesh.name !== "planterPot") return;

    const soil = potMesh.getObjectByName("potSoil");
    if (soil) potMesh.remove(soil); // TODO: Dispose geo/mat

    const seed = potMesh.getObjectByName("potSeed"); // Should be gone, but just in case
    if (seed) potMesh.remove(seed);

    if (potMesh.userData.plantMesh) {
        potMesh.remove(potMesh.userData.plantMesh); // TODO: Dispose geo/mat
    }

    // Reset userData
    potMesh.userData.hasSoil = false;
    potMesh.userData.isWatered = false;
    potMesh.userData.hasSeed = false;
    potMesh.userData.growthStartTime = null;
    potMesh.userData.currentGrowthStage = 0;
    potMesh.userData.isMature = false;
    potMesh.userData.plantMesh = null;

    console.log("Pot reset:", potMesh.uuid);
}