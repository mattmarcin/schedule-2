import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Ground } from './Ground';
import { Skybox } from './Skybox';
import { ControlsManager } from './ControlsManager';
import { createHouse } from './House'; // Import the house creation function
import { createInteractionBillboard } from './Utils'; // Import billboard utility

export class Game {
    private sceneManager: SceneManager;
    private controlsManager: ControlsManager;
    private ground: Ground;
    private skybox: Skybox;
    private clock: THREE.Clock;
    private raycaster: THREE.Raycaster;
    private pointer: THREE.Vector2;
    private interactionBillboard: THREE.Sprite; // Billboard sprite
    private currentlyHoveredDoor: THREE.Mesh | null = null; // Track hovered door

    constructor() {
        this.sceneManager = new SceneManager();
        this.controlsManager = new ControlsManager(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        this.ground = new Ground(this.sceneManager.scene);
        this.skybox = new Skybox(this.sceneManager.scene);
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        // Shorter range for hover detection than click interaction
        this.raycaster.far = 5;

        // Create and add billboard
        this.interactionBillboard = createInteractionBillboard();
        this.sceneManager.scene.add(this.interactionBillboard);

        // Add the controls object to the scene
        this.sceneManager.scene.add(this.controlsManager.getControls().getObject());

        // Add houses
        this.addHouses();

        // Start the animation loop
        this.animate();

        // Add click listener for interactions
        window.addEventListener('pointerdown', this.onPointerDown.bind(this), false);
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();

        // Update controls
        this.controlsManager.update(deltaTime);

        // Handle interaction prompts (billboard)
        this.updateInteractionPrompt();

        // Render the scene
        this.sceneManager.render();
    }

    private updateInteractionPrompt(): void {
        this.currentlyHoveredDoor = null; // Reset hover state
        this.interactionBillboard.visible = false; // Hide by default

        if (!this.controlsManager.controls.isLocked) {
            return; // Don't show prompts if pointer isn't locked
        }

        // Raycast from camera center
        this.pointer.x = 0;
        this.pointer.y = 0;
        this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);

        for (const intersect of intersects) {
            // Check if it's an interactable door
            if (intersect.object.name === "houseDoor" && intersect.object.userData?.interactable) {
                const door = intersect.object as THREE.Mesh;
                this.currentlyHoveredDoor = door; // Store hovered door for click handler

                // Find the doorknob (child of the door)
                const doorknob = door.getObjectByName("doorknob");
                if (doorknob) {
                    // Calculate world position of doorknob
                    const knobWorldPosition = new THREE.Vector3();
                    doorknob.getWorldPosition(knobWorldPosition);

                    // Position billboard slightly above the doorknob
                    this.interactionBillboard.position.copy(knobWorldPosition);
                    this.interactionBillboard.position.y += 0.3; // Adjust vertical offset
                    this.interactionBillboard.visible = true;
                }
                break; // Found the closest interactable door
            }
        }
    }


    private addHouses(): void {
        const housePositions = [
            new THREE.Vector3(-6, 0, 10), new THREE.Vector3(6, 0, 15),
            new THREE.Vector3(-6, 0, 25), new THREE.Vector3(6, 0, 30),
            new THREE.Vector3(-6, 0, -5),
        ];
        const houseColors = [ 0xffdddd, 0xddffdd, 0xddddff, 0xffffdd, 0xffddee ];

        housePositions.forEach((pos, index) => {
            const color = houseColors[index % houseColors.length];
            const adjustedPos = pos.clone();
            adjustedPos.y = 0.05; // Elevate house
            const house = createHouse(adjustedPos, color);
            if (this.sceneManager && this.sceneManager.scene) {
                 this.sceneManager.scene.add(house);
            } else {
                console.error("SceneManager or Scene not initialized when adding houses.");
            }
        });
    }

    private onPointerDown(event: PointerEvent): void {
        // Interact only if pointer is locked and hovering over a door
        if (this.controlsManager.controls.isLocked && this.currentlyHoveredDoor) {
            this.toggleDoor(this.currentlyHoveredDoor);
            // Optional: Reset hover state immediately after click if desired
            // this.currentlyHoveredDoor = null;
            // this.interactionBillboard.visible = false;
        } else if (!this.controlsManager.controls.isLocked) {
            // Optional: Try to lock pointer on click if not already locked
            // this.controlsManager.controls.lock();
        }
    }

    private toggleDoor(door: THREE.Mesh): void {
        if (!door.userData) return;

        const isOpen = door.userData.isOpen;
        const targetRotationY = isOpen ? 0 : -Math.PI / 1.8; // Open inwards

        // Simple immediate rotation
        door.rotation.y = targetRotationY;
        door.userData.isOpen = !isOpen;

        console.log(`Door toggled. New state: ${door.userData.isOpen ? 'Open' : 'Closed'}`);
    }

} // End of Game class