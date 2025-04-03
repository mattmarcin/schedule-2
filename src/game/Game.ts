import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Ground } from './Ground';
import { Skybox } from './Skybox';
import { ControlsManager } from './ControlsManager';
import { createHouse } from './House'; // Import the house creation function
import { InteractionPrompt } from './Utils'; // Import billboard CLASS
import { InventoryManager } from './InventoryManager'; // Import inventory manager
import { createHeldItemMesh, HeldItemType } from './HeldItem'; // Import type as well
import { addSoilToPot, waterPotSoil, addSeedToPot, updatePlantGrowth, resetPot } from './PlanterPot';
import { createNPC } from './NPC'; // Import NPC creator
import { createSmokeEffect, createCashEffect } from './Effects'; // Import effects
import { AudioManager } from './AudioManager'; // Import audio manager

export class Game {
    private sceneManager: SceneManager;
    private controlsManager: ControlsManager;
    private clock: THREE.Clock;
    private raycaster: THREE.Raycaster;
    private pointer: THREE.Vector2;
    private interactionPrompt: InteractionPrompt;
    private currentlyHoveredDoor: THREE.Mesh | null = null;
    private currentlyHoveredPot: THREE.Mesh | null = null;
    private currentlyHoveredNPC: THREE.Group | null = null;
    private inventoryManager: InventoryManager;
    private audioManager: AudioManager; // Added AudioManager instance
    private currentHeldItemMesh: THREE.Mesh | null = null;
    private planterPots: THREE.Mesh[] = [];
    private progressBarContainer: HTMLElement | null = null;
    private progressBarFill: HTMLElement | null = null;
    private readonly GROWTH_DURATION_MS = 20 * 1000;
    private readonly baggieSlotIndex = 3;
    private readonly cashSlotIndex = 4; // Define index for cash item (0-based)

    constructor() {
        this.sceneManager = new SceneManager();
        this.controlsManager = new ControlsManager(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        new Ground(this.sceneManager.scene);
        new Skybox(this.sceneManager.scene);
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.raycaster.far = 5;

        this.interactionPrompt = new InteractionPrompt('Click to Interact');
        this.sceneManager.scene.add(this.interactionPrompt.getElement());

        this.sceneManager.scene.add(this.controlsManager.getControls().getObject());

        // Initialize Managers
        this.inventoryManager = new InventoryManager();
        this.audioManager = new AudioManager(this.sceneManager.camera); // Initialize AudioManager

        // Add Game Objects
        this.addHouses();
        this.addNPCs();

        // Load Assets & Setup
        this.loadSounds(); // Load sounds asynchronously
        this.setupInitialInventory();

        // Get UI Elements
        this.progressBarContainer = document.getElementById('progress-bar-container');
        this.progressBarFill = document.getElementById('progress-bar-fill');

        // Add Listeners
        window.addEventListener('pointerdown', this.onPointerDown.bind(this), false);
        window.addEventListener('keydown', this.handleKeyDown.bind(this), false);

        // Start Game Loop
        this.animate();
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (event.code.startsWith('Digit')) {
            const digit = parseInt(event.code.replace('Digit', ''), 10);
            if (digit >= 1 && digit <= 5) {
                this.handleInventorySelection(digit - 1);
            }
        }
        if (event.code === 'KeyE') {
            this.handleInteractionKey();
        }
    }


    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();
        this.controlsManager.update(deltaTime);
        const currentTime = Date.now();
        this.planterPots.forEach(pot => updatePlantGrowth(pot, currentTime));
        this.updateInteractionUI(currentTime);
        this.sceneManager.render();
    }

    private updateInteractionUI(currentTime: number): void {
        let foundInteractable = false;
        this.currentlyHoveredDoor = null;
        this.currentlyHoveredPot = null;
        this.currentlyHoveredNPC = null;
        let showProgressBar = false;

        if (!this.controlsManager.controls.isLocked) {
            this.interactionPrompt.hide();
            this.updateProgressBar(false, currentTime);
            return;
        }

        this.pointer.x = 0;
        this.pointer.y = 0;
        this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);

        const holdingSoil = this.inventoryManager.getSelectedSlotIndex() === 0;
        const holdingWateringCan = this.inventoryManager.getSelectedSlotIndex() === 1;
        const holdingSeedVial = this.inventoryManager.getSelectedSlotIndex() === 2;
        const holdingBaggie = this.inventoryManager.getSelectedSlotIndex() === this.baggieSlotIndex && this.inventoryManager.getItemCount(this.baggieSlotIndex) > 0;

        for (const intersect of intersects) {
            const obj = intersect.object;
            const parentGroup = obj.parent;

            // Door Interaction
            if (obj.name === "houseDoor" && obj.userData?.interactable) {
                const door = obj as THREE.Mesh;
                this.currentlyHoveredDoor = door;
                const doorknob = door.getObjectByName("doorknob");
                this.interactionPrompt.setText("Click to Toggle");
                this.interactionPrompt.update(doorknob || door);
                foundInteractable = true;
                break;
            }

            // Pot Interactions
            if (obj.name === "planterPot" && obj.userData?.interactable) {
                const pot = obj as THREE.Mesh;
                if (!pot.userData.hasSoil && holdingSoil) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Add Soil");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true; break;
                } else if (pot.userData.hasSoil && !pot.userData.isWatered && holdingWateringCan) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Water Soil");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true; break;
                } else if (pot.userData.hasSoil && pot.userData.isWatered && !pot.userData.hasSeed && holdingSeedVial) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Add Seed");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true; break;
                } else if (pot.userData.isMature) {
                    this.currentlyHoveredPot = pot;
                    this.interactionPrompt.setText("(E): Harvest");
                    this.interactionPrompt.update(pot, 0.3);
                    foundInteractable = true; break;
                } else if (pot.userData.hasSeed && pot.userData.growthStartTime !== null && !pot.userData.isMature) {
                     this.currentlyHoveredPot = pot;
                     showProgressBar = true;
                }
            }

            // NPC Interaction (Selling)
            if (parentGroup instanceof THREE.Group && parentGroup.name === "npc" && parentGroup.userData?.interactable && holdingBaggie && !parentGroup.userData.isSmoking) {
                this.currentlyHoveredNPC = parentGroup;
                this.interactionPrompt.setText("(E): Sell Baggie");
                const head = parentGroup.children.find(c => c.children.some(gc => gc.name === 'eyeWhite'));
                this.interactionPrompt.update(head || parentGroup, 0.5);
                foundInteractable = true;
                break;
            }
        }

        if (!foundInteractable) this.interactionPrompt.hide();
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
            const adjustedPos = pos.clone(); adjustedPos.y = 0.05;
            const house = createHouse(adjustedPos, color);
            if (this.sceneManager?.scene) {
                 this.sceneManager.scene.add(house);
                 house.traverse((child) => {
                     if (child instanceof THREE.Mesh && child.name === 'planterPot') {
                         this.planterPots.push(child);
                     }
                 });
            } else console.error("SceneManager not ready for houses.");
        });
        console.log(`Found ${this.planterPots.length} planter pots.`);
    }

    private onPointerDown(_event: PointerEvent): void {
        if (this.controlsManager.controls.isLocked && this.currentlyHoveredDoor) {
            this.toggleDoor(this.currentlyHoveredDoor);
        } else if (!this.controlsManager.controls.isLocked) {
            // this.controlsManager.controls.lock();
        }
    }

    private toggleDoor(door: THREE.Mesh): void {
        if (!door.userData) return;
        const isOpen = door.userData.isOpen;
        door.rotation.y = isOpen ? 0 : -Math.PI / 1.8;
        door.userData.isOpen = !isOpen;
        console.log(`Door toggled. New state: ${door.userData.isOpen ? 'Open' : 'Closed'}`);
    }

    private handleInteractionKey(): void {
        if (this.currentlyHoveredPot) {
            if (!this.currentlyHoveredPot.userData.hasSoil && this.inventoryManager.getSelectedSlotIndex() === 0) {
                if (addSoilToPot(this.currentlyHoveredPot)) this.interactionPrompt.hide();
            } else if (this.currentlyHoveredPot.userData.hasSoil && !this.currentlyHoveredPot.userData.isWatered && this.inventoryManager.getSelectedSlotIndex() === 1) {
                if (waterPotSoil(this.currentlyHoveredPot)) this.interactionPrompt.hide();
            } else if (this.currentlyHoveredPot.userData.hasSoil && this.currentlyHoveredPot.userData.isWatered && !this.currentlyHoveredPot.userData.hasSeed && this.inventoryManager.getSelectedSlotIndex() === 2) {
                 if (addSeedToPot(this.currentlyHoveredPot)) this.interactionPrompt.hide();
            } else if (this.currentlyHoveredPot.userData.isMature) {
                resetPot(this.currentlyHoveredPot);
                this.inventoryManager.addItemCount(this.baggieSlotIndex, 1);
                console.log("Harvested plant via E key");
                this.interactionPrompt.hide();
            }
        } else if (this.currentlyHoveredNPC && this.inventoryManager.getSelectedSlotIndex() === this.baggieSlotIndex && this.inventoryManager.getItemCount(this.baggieSlotIndex) > 0) {
            this.sellBaggieToNPC(this.currentlyHoveredNPC);
        }
    }

    private setupInitialInventory(): void {
        this.inventoryManager.setItem(0, '/icons/soil.png', 1);
        this.inventoryManager.setItem(1, '/icons/wateringcan.png', 1);
        this.inventoryManager.setItem(2, '/icons/vial.png', 1);
        this.inventoryManager.setItem(3, '/icons/baggie.png', 0);
        this.inventoryManager.setItem(this.cashSlotIndex, '/icons/cash.png', 0); // Add cash slot
    }

    private handleInventorySelection(slotIndex: number): void {
        console.log(`Selecting inventory slot: ${slotIndex}`);
        if (this.inventoryManager.getSelectedSlotIndex() === slotIndex) {
             this.inventoryManager.selectSlot(null);
             this.updateHeldItem('none');
        } else {
            this.inventoryManager.selectSlot(slotIndex);
            let itemType: HeldItemType = 'none';
            if (slotIndex === 0) itemType = 'soil';
            else if (slotIndex === 1) itemType = 'wateringCan';
            else if (slotIndex === 2) itemType = 'seedVial';
            // Note: Baggie (3) and Cash (4) don't have held item models
            this.updateHeldItem(itemType);
        }
    }

    private updateHeldItem(type: HeldItemType): void {
        if (this.currentHeldItemMesh) {
            this.sceneManager.camera.remove(this.currentHeldItemMesh);
            this.currentHeldItemMesh = null;
        }
        const newMesh = createHeldItemMesh(type);
        if (newMesh) {
            this.sceneManager.camera.add(newMesh);
            this.currentHeldItemMesh = newMesh;
        }
    }

    private updateProgressBar(show: boolean, currentTime: number): void {
        if (!this.progressBarContainer || !this.progressBarFill) return;
        if (show && this.currentlyHoveredPot?.userData.growthStartTime && !this.currentlyHoveredPot.userData.isMature) {
            const elapsedTime = currentTime - this.currentlyHoveredPot.userData.growthStartTime;
            const progress = Math.min(100, (elapsedTime / this.GROWTH_DURATION_MS) * 100);
            this.progressBarFill.style.width = `${progress}%`;
            const potPosition = new THREE.Vector3();
            this.currentlyHoveredPot.getWorldPosition(potPosition);
            const screenPosition = potPosition.clone().project(this.sceneManager.camera);
            const screenX = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;
            this.progressBarContainer.style.left = `${screenX - this.progressBarContainer.offsetWidth / 2}px`;
            this.progressBarContainer.style.top = `${screenY + 15}px`;
            this.progressBarContainer.style.display = 'block';
        } else {
            this.progressBarContainer.style.display = 'none';
        }
    }

    private addNPCs(): void {
        const npcPositions = [ new THREE.Vector3(1, 0, 8), new THREE.Vector3(-1, 0, 20), new THREE.Vector3(0, 0, -10) ];
        const npcColors = [ 0xadd8e6, 0x90ee90, 0xffb6c1 ];
        npcPositions.forEach((pos, index) => {
            const color = npcColors[index % npcColors.length];
            const npc = createNPC(pos, color);
            npc.position.y = 0;
            this.sceneManager.scene.add(npc);
        });
    }

    private sellBaggieToNPC(npc: THREE.Group): void {
        if (!npc || !npc.userData || npc.userData.isSmoking) return;

        // 1. Update Inventory
        this.inventoryManager.addItemCount(this.baggieSlotIndex, -1);
        this.inventoryManager.addItemCount(this.cashSlotIndex, 50); // Add $50 cash
        console.log("Sold baggie to NPC:", npc.uuid);

        // 2. Change eye color
        const eyeMeshes: THREE.Mesh[] = [];
        npc.traverse((child) => {
            if (child instanceof THREE.Mesh && child.name === "eyeWhite") eyeMeshes.push(child);
        });
        if (eyeMeshes.length > 0) {
            eyeMeshes.forEach(eyeMesh => {
                if (eyeMesh.material instanceof THREE.MeshStandardMaterial) eyeMesh.material.color.setHex(0xff8888);
            });
            setTimeout(() => {
                 eyeMeshes.forEach(eyeMesh => {
                    if (eyeMesh.material instanceof THREE.MeshStandardMaterial) eyeMesh.material.color.setHex(0xffffff);
                });
                 if (npc.userData) npc.userData.isSmoking = false;
                 console.log("NPC eyes reset and interaction enabled:", npc.uuid);
            }, 10000); // Reset after 10 seconds
        } else console.warn("Could not find eye meshes on NPC to change color.");

        // 3. Trigger Cash Particle Effect
        const npcPosition = new THREE.Vector3();
        npc.getWorldPosition(npcPosition);
        const playerPosition = this.sceneManager.camera.position.clone();
        createCashEffect(npcPosition, playerPosition, this.sceneManager.scene, 1000);

        // 4. Trigger Smoke Effect
        const head = npc.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry && c.position.y > 1.0);
        const smokePosition = new THREE.Vector3();
        if (head instanceof THREE.Mesh) {
             head.getWorldPosition(smokePosition);
             const headRadius = (head.geometry as THREE.SphereGeometry).parameters.radius || 0.3;
             smokePosition.y += headRadius;
        } else {
            npc.getWorldPosition(smokePosition);
            smokePosition.y += 1.8;
        }
        createSmokeEffect(smokePosition, this.sceneManager.scene, 7500);

        // 5. Play Sounds
        this.audioManager.playSound('sold');
        setTimeout(() => this.audioManager.playSound('ching'), 300);

        // 6. Update NPC state and hide prompt
        npc.userData.isSmoking = true;
        this.interactionPrompt.hide();
    }

    private async loadSounds(): Promise<void> {
        try {
            // IMPORTANT: Ensure audio files exist in /public/audio/
            await this.audioManager.loadSound('sold', '/audio/sold1.mp3', false, 0.6);
            await this.audioManager.loadSound('ching', '/audio/ca-ching.mp3', false, 0.5);
            console.log("All sounds loaded.");
        } catch (error) {
            console.error("Error loading sounds:", error);
        }
    }

} // End of Game class