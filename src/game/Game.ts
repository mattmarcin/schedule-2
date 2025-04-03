import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Ground } from './Ground';
import { Skybox } from './Skybox';
import { ControlsManager } from './ControlsManager';
import { createHouse } from './House'; // Import the house creation function
import { InteractionPrompt } from './Utils'; // Import billboard CLASS
import { InventoryManager } from './InventoryManager'; // Import inventory manager
import { createHeldItemMesh, HeldItemType } from './HeldItem'; // Import type as well
import { addSoilToPot, waterPotSoil, addSeedToPot, updatePlantGrowth, resetPot } from './PlanterPot'; // Import all pot functions

export class Game {
    private sceneManager: SceneManager;
    private controlsManager: ControlsManager;
    private ground: Ground;
    private skybox: Skybox;
    private clock: THREE.Clock;
    private raycaster: THREE.Raycaster;
    private pointer: THREE.Vector2;
    private interactionPrompt: InteractionPrompt; // Use the new class
    private currentlyHoveredDoor: THREE.Mesh | null = null;
    private currentlyHoveredPot: THREE.Mesh | null = null; // Track hovered pot
    private inventoryManager: InventoryManager;
    private currentHeldItemMesh: THREE.Mesh | null = null;
    private planterPots: THREE.Mesh[] = [];
    private progressBarContainer: HTMLElement | null = null;
    private progressBarFill: HTMLElement | null = null;
    private readonly GROWTH_DURATION_MS = 60 * 1000;
    private readonly baggieSlotIndex = 3; // Define index for baggie item (0-based)

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

        // Create and add interaction prompt
        this.interactionPrompt = new InteractionPrompt('Click to Interact');
        this.sceneManager.scene.add(this.interactionPrompt.getElement());

        // Add the controls object to the scene
        this.sceneManager.scene.add(this.controlsManager.getControls().getObject());

        // Add houses
        this.addHouses();

        // Start the animation loop
        this.animate();

        // Add click listener for interactions
        window.addEventListener('pointerdown', this.onPointerDown.bind(this), false);

        // Initialize Inventory UI
        this.inventoryManager = new InventoryManager();
        // Add keydown listener for inventory selection
        window.addEventListener('keydown', this.handleKeyDown.bind(this), false);

        // Initialize Inventory UI & Items
        this.inventoryManager = new InventoryManager();
        this.setupInitialInventory(); // Add items to inventory UI

        // Get progress bar elements
        this.progressBarContainer = document.getElementById('progress-bar-container');
        this.progressBarFill = document.getElementById('progress-bar-fill');
    }

    private handleKeyDown(event: KeyboardEvent): void {
        // Handle inventory selection (1-5 keys)
        // We subtract 1 because keys are 1-based, slots are 0-based
        if (event.code.startsWith('Digit')) {
            const digit = parseInt(event.code.replace('Digit', ''), 10);
            if (digit >= 1 && digit <= 5) { // Assuming 5 slots max for now
                this.handleInventorySelection(digit - 1);
            }
        }
        // Note: This might conflict with ControlsManager if it uses digit keys.
        // Handle 'E' key for interactions
        if (event.code === 'KeyE') {
            this.handleInteractionKey();
        }
    }


    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();

        // Update controls
        this.controlsManager.update(deltaTime);

        // Update plant growth
        const currentTime = Date.now();
        this.planterPots.forEach(pot => updatePlantGrowth(pot, currentTime));

        // Handle interaction prompts and progress bar
        this.updateInteractionUI(currentTime);

        // Render the scene
        this.sceneManager.render();
    }

    // Renamed function to reflect it handles more than just the prompt
    private updateInteractionUI(currentTime: number): void {
        let foundInteractable = false; // Flag to check if any prompt should be shown
        this.currentlyHoveredDoor = null; // Reset hover states
        this.currentlyHoveredPot = null;
        let showProgressBar = false; // Flag to control progress bar visibility

        if (!this.controlsManager.controls.isLocked) {
            return; // Don't show prompts if pointer isn't locked
        }

        // Raycast from camera center
        this.pointer.x = 0;
        this.pointer.y = 0;
        this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);

        const holdingSoil = this.inventoryManager.getSelectedSlotIndex() === 0;
        const holdingWateringCan = this.inventoryManager.getSelectedSlotIndex() === 1;
        const holdingSeedVial = this.inventoryManager.getSelectedSlotIndex() === 2;
        // const baggieSlotIndex = 3; // No longer needed here
        const baggieSlotIndex = 3; // Define index for baggie

        for (const intersect of intersects) {
            const obj = intersect.object;

            // --- Check for Door Interaction ---
            if (obj.name === "houseDoor" && obj.userData?.interactable) {
                const door = obj as THREE.Mesh;
                this.currentlyHoveredDoor = door;
                const doorknob = door.getObjectByName("doorknob");
                this.interactionPrompt.setText("Click to Toggle"); // Set text for door
                this.interactionPrompt.update(doorknob || door); // Position near doorknob or door center
                foundInteractable = true;
                break; // Prioritize door interaction
            }

            // --- Check for Pot Interactions ---
            if (obj.name === "planterPot" && obj.userData?.interactable) {
                const pot = obj as THREE.Mesh;
                // Check for adding soil
                if (!pot.userData.hasSoil && holdingSoil) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Add Soil");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true;
                    break; // Found pot interaction
                }
                // Check for watering soil
                else if (pot.userData.hasSoil && !pot.userData.isWatered && holdingWateringCan) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Water Soil");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true;
                    break; // Found pot interaction
                }
                // Check for adding seed
                else if (pot.userData.hasSoil && pot.userData.isWatered && !pot.userData.hasSeed && holdingSeedVial) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Add Seed");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true;
                    break; // Found pot interaction
                }
                // Check for harvesting
                else if (pot.userData.isMature) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Harvest");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true;
                    break; // Found pot interaction
                }
                // Check if pot is currently growing (for progress bar)
                else if (pot.userData.hasSeed && pot.userData.growthStartTime !== null && !pot.userData.isMature) {
                     this.currentlyHoveredPot = pot; // Still track for progress bar even if no action prompt
                     showProgressBar = true;
                     // Don't break here, allow checking for door prompts etc.
                }
            }

            // Add other interactable object checks here
        }

        // Hide interaction prompt if no specific interaction found
        if (!foundInteractable) {
            this.interactionPrompt.hide();
        }

        // Update and show/hide progress bar
        this.updateProgressBar(showProgressBar, currentTime);
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
                 // Find and store pots from this house
                 house.traverse((child) => {
                     if (child instanceof THREE.Mesh && child.name === 'planterPot') {
                         this.planterPots.push(child);
                     }
                 });
            } else {
                console.error("SceneManager or Scene not initialized when adding houses.");
            }
        });
        console.log(`Found ${this.planterPots.length} planter pots.`);
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

    private handleInteractionKey(): void {
        // Check for adding soil
        if (this.currentlyHoveredPot && !this.currentlyHoveredPot.userData.hasSoil && this.inventoryManager.getSelectedSlotIndex() === 0) {
            if (addSoilToPot(this.currentlyHoveredPot)) {
                console.log("Added soil via E key");
                this.interactionPrompt.hide(); // Hide prompt after successful interaction
                // Optionally consume soil item here
            }
        }
        // Check for watering soil
        else if (this.currentlyHoveredPot && this.currentlyHoveredPot.userData.hasSoil && !this.currentlyHoveredPot.userData.isWatered && this.inventoryManager.getSelectedSlotIndex() === 1) {
            if (waterPotSoil(this.currentlyHoveredPot)) {
                console.log("Watered soil via E key");
                this.interactionPrompt.hide(); // Hide prompt after successful interaction
                // Optionally consume water/make can empty here
            }
        }
        // Check for adding seed
        else if (this.currentlyHoveredPot && this.currentlyHoveredPot.userData.hasSoil && this.currentlyHoveredPot.userData.isWatered && !this.currentlyHoveredPot.userData.hasSeed && this.inventoryManager.getSelectedSlotIndex() === 2) {
             if (addSeedToPot(this.currentlyHoveredPot)) {
                 console.log("Added seed via E key");
                 this.interactionPrompt.hide(); // Hide prompt after successful interaction
                 // Optionally consume seed item here
                 // this.inventoryManager.setItemIcon(2, null); // Example: remove icon
                 // this.handleInventorySelection(null); // Deselect maybe?
             }
        }
        // Check for harvesting
        else if (this.currentlyHoveredPot && this.currentlyHoveredPot.userData.isMature) {
            resetPot(this.currentlyHoveredPot);
            this.inventoryManager.addItemCount(this.baggieSlotIndex, 1); // Use class property
            console.log("Harvested plant via E key");
            this.interactionPrompt.hide(); // Hide prompt
            // Progress bar will be hidden automatically on next frame by updateInteractionUI
        }
        // Add other 'E' key interactions here
    }

    private setupInitialInventory(): void {
        // Add soil to the first slot
        // IMPORTANT: Ensure icons exist in /public/icons/
        // Use setItem(index, iconUrl, initialCount)
        this.inventoryManager.setItem(0, '/icons/soil.png', 1);      // Slot 1 (Index 0) - Assume 1 bag
        this.inventoryManager.setItem(1, '/icons/wateringcan.png', 1); // Slot 2 (Index 1) - Assume 1 can
        this.inventoryManager.setItem(2, '/icons/vial.png', 1);      // Slot 3 (Index 2) - Assume 1 vial
        this.inventoryManager.setItem(3, '/icons/baggie.png', 0);     // Slot 4 (Index 3) - Baggie, starts empty
    }

    private handleInventorySelection(slotIndex: number): void {
        console.log(`Selecting inventory slot: ${slotIndex}`);

        // Check if selecting the currently selected slot to deselect
        if (this.inventoryManager.getSelectedSlotIndex() === slotIndex) {
             this.inventoryManager.selectSlot(null); // Deselect
             this.updateHeldItem('none');
        } else {
            this.inventoryManager.selectSlot(slotIndex);

            // Determine item type based on selected slot index
            let itemType: HeldItemType = 'none';
            if (slotIndex === 0) {
                itemType = 'soil';
            } else if (slotIndex === 1) {
                itemType = 'wateringCan';
            } else if (slotIndex === 2) {
                itemType = 'seedVial';
            }
            // Add more cases for slots 3 and 4 later

            this.updateHeldItem(itemType);
        }
    }

    private updateHeldItem(type: HeldItemType): void {
        // Remove existing held item if any
        if (this.currentHeldItemMesh) {
            this.sceneManager.camera.remove(this.currentHeldItemMesh);
            // Optional: Dispose geometry/material if needed for complex items
            this.currentHeldItemMesh = null;
        }

        // Create and add new item if type is not 'none'
        const newMesh = createHeldItemMesh(type);
        if (newMesh) {
            this.sceneManager.camera.add(newMesh);
            this.currentHeldItemMesh = newMesh;
        }
    }

    private updateProgressBar(show: boolean, currentTime: number): void {
        if (!this.progressBarContainer || !this.progressBarFill) return;

        if (show && this.currentlyHoveredPot && this.currentlyHoveredPot.userData.growthStartTime && !this.currentlyHoveredPot.userData.isMature) {
            const elapsedTime = currentTime - this.currentlyHoveredPot.userData.growthStartTime;
            const progress = Math.min(100, (elapsedTime / this.GROWTH_DURATION_MS) * 100);
            this.progressBarFill.style.width = `${progress}%`;

            // Position progress bar below the pot
            const potPosition = new THREE.Vector3();
            this.currentlyHoveredPot.getWorldPosition(potPosition);
            const screenPosition = potPosition.clone().project(this.sceneManager.camera);

            // Convert normalized device coordinates (-1 to +1) to screen pixels (0 to width/height)
            const screenX = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

            // Adjust position to center the bar below the pot
            this.progressBarContainer.style.left = `${screenX - this.progressBarContainer.offsetWidth / 2}px`;
            this.progressBarContainer.style.top = `${screenY + 15}px`; // Offset below the pot center

            this.progressBarContainer.style.display = 'block';
        } else {
            this.progressBarContainer.style.display = 'none';
        }
    }


} // End of Game class