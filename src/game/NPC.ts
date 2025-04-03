import * as THREE from 'three';

/**
 * Creates a simple cartoonish NPC mesh using primitives.
 */
export function createNPC(
    position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    bodyColor: THREE.ColorRepresentation = 0xffa07a // Light Salmon
): THREE.Group {

    const npcGroup = new THREE.Group();
    npcGroup.name = "npc";

    // --- Body (Capsule-like shape using Cylinder + Spheres) ---
    const bodyRadius = 0.4;
    const bodyHeight = 1.0; // Height of the cylindrical part
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });

    // Cylinder part
    const bodyCylinderGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 16);
    const bodyCylinderMesh = new THREE.Mesh(bodyCylinderGeo, bodyMaterial);
    bodyCylinderMesh.castShadow = true;
    bodyCylinderMesh.receiveShadow = true;
    bodyCylinderMesh.position.y = bodyHeight / 2 + bodyRadius; // Position so bottom sphere sits at y=0 relative to group

    // Top sphere cap
    const topSphereGeo = new THREE.SphereGeometry(bodyRadius, 16, 8);
    const topSphereMesh = new THREE.Mesh(topSphereGeo, bodyMaterial);
    topSphereMesh.castShadow = true;
    topSphereMesh.receiveShadow = true;
    topSphereMesh.position.y = bodyHeight + bodyRadius; // Position on top of cylinder

    // Bottom sphere cap
    const bottomSphereMesh = new THREE.Mesh(topSphereGeo, bodyMaterial); // Reuse geometry
    bottomSphereMesh.castShadow = true;
    bottomSphereMesh.receiveShadow = true;
    bottomSphereMesh.position.y = bodyRadius; // Position below cylinder

    npcGroup.add(bodyCylinderMesh);
    npcGroup.add(topSphereMesh);
    npcGroup.add(bottomSphereMesh);

    // --- Head ---
    const headRadius = 0.3;
    const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, bodyMaterial); // Same color as body for now
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    // Position head above the body capsule
    headMesh.position.y = bodyHeight + bodyRadius * 2 + headRadius * 0.8;
    npcGroup.add(headMesh);

    // --- Eyes ---
    const eyeRadius = 0.1; // Large bulbous eyes
    const pupilRadius = 0.04;
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black (Basic for no lighting needed)

    // Left Eye
    const leftEyeGroup = new THREE.Group();
    const leftEyeGeo = new THREE.SphereGeometry(eyeRadius, 12, 12);
    const leftEyeMesh = new THREE.Mesh(leftEyeGeo, eyeMaterial);
    leftEyeMesh.name = "eyeWhite"; // Name the eye mesh
    leftEyeMesh.castShadow = true;
    const leftPupilGeo = new THREE.SphereGeometry(pupilRadius, 8, 8);
    const leftPupilMesh = new THREE.Mesh(leftPupilGeo, pupilMaterial);
    leftPupilMesh.position.z = eyeRadius * 0.9; // Position pupil slightly forward on the eye surface
    leftEyeGroup.add(leftEyeMesh);
    leftEyeGroup.add(leftPupilMesh);
    // Position eye on the head
    leftEyeGroup.position.set(-headRadius * 0.5, 0, headRadius * 0.7);
    headMesh.add(leftEyeGroup); // Add eye group as child of head

    // Right Eye
    const rightEyeGroup = leftEyeGroup.clone(true); // Clone left eye including pupil
    rightEyeGroup.position.x = headRadius * 0.5; // Position on the right side
    headMesh.add(rightEyeGroup);


    // Position the entire NPC group
    npcGroup.position.copy(position);

    // Add userData for potential future interaction/state
    npcGroup.userData = {
        type: 'npc',
        interactable: true, // Make NPC interactable
        isSmoking: false    // Track smoking state
    };

    return npcGroup;
}