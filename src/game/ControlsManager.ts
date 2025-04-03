import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'; // Note the .js extension is needed for Vite

export class ControlsManager {
    public controls: PointerLockControls;
    private moveForward = false;
    private moveBackward = false;
    private moveLeft = false;
    private moveRight = false;
    private velocity = new THREE.Vector3();
    private direction = new THREE.Vector3();
    private moveSpeed = 50.0; // Adjust as needed
    private damping = 10.0; // Higher value = more damping (less sliding)

    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement) {
        this.controls = new PointerLockControls(camera, domElement);

        // Add listeners to lock/unlock pointer
        domElement.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            console.log('Pointer locked');
            // You could display instructions or hide UI elements here
        });

        this.controls.addEventListener('unlock', () => {
            console.log('Pointer unlocked');
            // You could show a pause menu or instructions here
        });

        // Add keyboard listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    private onKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    public update(deltaTime: number): void {
        if (!this.controls.isLocked) {
            // Reset velocity and direction if pointer is not locked
            this.velocity.x -= this.velocity.x * this.damping * deltaTime;
            this.velocity.z -= this.velocity.z * this.damping * deltaTime;
            this.controls.moveRight(-this.velocity.x * deltaTime);
            this.controls.moveForward(-this.velocity.z * deltaTime);
            return;
        }

        // Calculate movement direction based on key states
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize(); // Ensures consistent speed in all directions

        // Apply velocity based on direction and speed
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * this.moveSpeed * deltaTime;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * this.moveSpeed * deltaTime;
        }

        // Apply damping to simulate friction
        this.velocity.x -= this.velocity.x * this.damping * deltaTime;
        this.velocity.z -= this.velocity.z * this.damping * deltaTime;

        // Move the controls
        this.controls.moveRight(-this.velocity.x * deltaTime);
        this.controls.moveForward(-this.velocity.z * deltaTime);

        // Optional: Prevent flying by locking Y position (if needed)
        // this.controls.getObject().position.y = 1.6; // Keep camera height constant
    }

    public getControls(): PointerLockControls {
        return this.controls;
    }
}