import * as THREE from 'three';
import { createPlanterPot } from './PlanterPot'; // Import the pot creator

// Simple function to create a basic house mesh (Group)
export function createHouse(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    color: THREE.ColorRepresentation = 0xaaaaaa // Default grey color
): THREE.Group {
    const houseGroup = new THREE.Group();
    houseGroup.name = "houseGroup";
    const wallThickness = 0.1; // Use this for wall depth

    // --- Dimensions ---
    const baseWidth = 4;    // Exterior width
    const baseHeight = 2.5; // Wall height
    const baseDepth = 5;    // Exterior depth
    const doorWidth = 0.8;
    const doorHeight = 1.8;

    // --- Materials ---
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide, // Render interior and exterior
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc, // Slightly different color for floor
        side: THREE.DoubleSide,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const knobMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // --- Floor ---
    const floorGeometry = new THREE.BoxGeometry(baseWidth, wallThickness, baseDepth);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = wallThickness / 2; // Floor sits on y=0
    floorMesh.receiveShadow = true;
    houseGroup.add(floorMesh);

    // --- Walls ---
    // Back Wall
    const backWallGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, wallThickness);
    const backWallMesh = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWallMesh.position.set(0, baseHeight / 2 + wallThickness, -baseDepth / 2 + wallThickness / 2);
    backWallMesh.castShadow = true;
    backWallMesh.receiveShadow = true;
    houseGroup.add(backWallMesh);

    // Left Wall
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, baseHeight, baseDepth);
    const leftWallMesh = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWallMesh.position.set(-baseWidth / 2 + wallThickness / 2, baseHeight / 2 + wallThickness, 0);
    leftWallMesh.castShadow = true;
    leftWallMesh.receiveShadow = true;
    houseGroup.add(leftWallMesh);

    // Right Wall
    const rightWallMesh = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWallMesh.position.set(baseWidth / 2 - wallThickness / 2, baseHeight / 2 + wallThickness, 0);
    rightWallMesh.castShadow = true;
    rightWallMesh.receiveShadow = true;
    houseGroup.add(rightWallMesh);

    // Front Wall (with opening)
    const frontWallSideWidth = (baseWidth - doorWidth) / 2;
    // Left part
    const frontLeftGeometry = new THREE.BoxGeometry(frontWallSideWidth, baseHeight, wallThickness);
    const frontLeftMesh = new THREE.Mesh(frontLeftGeometry, wallMaterial);
    frontLeftMesh.position.set(-baseWidth / 2 + frontWallSideWidth / 2, baseHeight / 2 + wallThickness, baseDepth / 2 - wallThickness / 2);
    frontLeftMesh.castShadow = true;
    frontLeftMesh.receiveShadow = true;
    houseGroup.add(frontLeftMesh);
    // Right part
    const frontRightMesh = new THREE.Mesh(frontLeftGeometry, wallMaterial); // Reuse geometry
    frontRightMesh.position.set(baseWidth / 2 - frontWallSideWidth / 2, baseHeight / 2 + wallThickness, baseDepth / 2 - wallThickness / 2);
    frontRightMesh.castShadow = true;
    frontRightMesh.receiveShadow = true;
    houseGroup.add(frontRightMesh);
    // Top part (lintel)
    const frontTopHeight = baseHeight - doorHeight;
    const frontTopGeometry = new THREE.BoxGeometry(doorWidth, frontTopHeight, wallThickness);
    const frontTopMesh = new THREE.Mesh(frontTopGeometry, wallMaterial);
    frontTopMesh.position.set(0, baseHeight - frontTopHeight / 2 + wallThickness, baseDepth / 2 - wallThickness / 2);
    frontTopMesh.castShadow = true;
    frontTopMesh.receiveShadow = true;
    houseGroup.add(frontTopMesh);


    // --- Roof ---
    const roofHeight = 1.5;
    const roofGeometry = new THREE.BufferGeometry();
    // Adjust roof vertices to sit on top of walls (at y = baseHeight + wallThickness)
    const roofY = baseHeight + wallThickness;
    const vertices = new Float32Array([
        -baseWidth / 2, roofY, baseDepth / 2, baseWidth / 2, roofY, baseDepth / 2, 0, roofY + roofHeight, baseDepth / 2,
        -baseWidth / 2, roofY, -baseDepth / 2, baseWidth / 2, roofY, -baseDepth / 2, 0, roofY + roofHeight, -baseDepth / 2,
    ]);
    const indices = [ 0, 1, 2, 4, 3, 5, 3, 0, 2, 3, 2, 5, 1, 4, 5, 1, 5, 2 ];
    roofGeometry.setIndex(indices);
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    roofGeometry.computeVertexNormals();
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.castShadow = true;
    houseGroup.add(roofMesh);

    // --- Door ---
    const doorDepth = 0.05; // Make door thinner than wall
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
    doorGeometry.translate(doorWidth / 2, 0, 0); // Hinge on left edge

    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.name = "houseDoor";
    doorMesh.castShadow = true;
    // Position hinge at the edge of the opening
    const doorHingeX = -doorWidth / 2;
    // Position door slightly inside the front wall plane
    doorMesh.position.set(doorHingeX, doorHeight / 2 + wallThickness, baseDepth / 2 - wallThickness / 2 - doorDepth / 2);
    doorMesh.userData = { isOpen: false, interactable: true };
    houseGroup.add(doorMesh);

    // --- Doorknob ---
    const knobRadius = 0.05;
    const knobGeometry = new THREE.SphereGeometry(knobRadius, 8, 8);
    const doorknobMesh = new THREE.Mesh(knobGeometry, knobMaterial);
    doorknobMesh.position.set(doorWidth - knobRadius * 2, 0, doorDepth / 2 + knobRadius);
    doorknobMesh.name = "doorknob";
    doorMesh.add(doorknobMesh);

    // --- Interior ---
    // Adjust interior positioning based on new floor level (wallThickness)
    const interiorGroup = new THREE.Group();
    interiorGroup.position.y = wallThickness; // Already accounts for floor thickness

    // Bed
    const bedWidth = 1.5;
    const bedHeight = 0.4;
    const bedDepth = 2.5;
    const bedGeometry = new THREE.BoxGeometry(bedWidth, bedHeight, bedDepth);
    const bedMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
    bedMesh.castShadow = true;
    bedMesh.receiveShadow = true;
    // Position relative to interior walls
    bedMesh.position.set(baseWidth / 4 - wallThickness, bedHeight / 2, -baseDepth / 2 + bedDepth / 2 + wallThickness * 1.5);
    interiorGroup.add(bedMesh);

    // Nightstand
    const nsWidth = 0.5;
    const nsHeight = 0.6;
    const nsDepth = 0.5;
    const nsGeometry = new THREE.BoxGeometry(nsWidth, nsHeight, nsDepth);
    const nsMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const nsMesh = new THREE.Mesh(nsGeometry, nsMaterial);
    nsMesh.castShadow = true;
    nsMesh.receiveShadow = true;
    const bedHeadZ = -baseDepth / 2 + wallThickness * 1.5;
    nsMesh.position.set(bedMesh.position.x - bedWidth / 2 - nsWidth / 2 - 0.1, nsHeight / 2, bedHeadZ + nsDepth / 2);
    interiorGroup.add(nsMesh);

    // Planter Pots
    const potSpacing = 1.0;
    const potStartZ = baseDepth / 2 - 1.0; // Place near front wall
    const potPosX = -baseWidth / 2 + 0.7; // Place along left wall

    for (let i = 0; i < 3; i++) {
        const pot = createPlanterPot(
            new THREE.Vector3(potPosX, 0, potStartZ - i * potSpacing) // Position on floor (local to interiorGroup)
        );
        interiorGroup.add(pot);
    }


    houseGroup.add(interiorGroup);

    // Position the entire house group
    houseGroup.position.copy(position);

    return houseGroup;
}