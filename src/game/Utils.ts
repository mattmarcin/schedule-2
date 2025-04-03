import * as THREE from 'three';

/**
 * Creates a canvas texture with text. (Internal helper)
 */
function createTextTexture(text: string, fontSize = 48, fontFace = 'Arial', textColor = 'rgba(255, 255, 255, 1.0)'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error("Could not get 2D context from canvas");
    }

    context.font = `${fontSize}px ${fontFace}`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    canvas.width = textWidth + 10;
    canvas.height = textHeight + 10;

    // Re-apply settings after resize
    context.font = `${fontSize}px ${fontFace}`;
    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Manages an interaction prompt billboard sprite.
 */
export class InteractionPrompt {
    private sprite: THREE.Sprite;
    private tempWorldPosition = new THREE.Vector3(); // Reusable vector for calculations

    constructor(text: string = 'Click to Interact') {
        const texture = createTextTexture(text);
        const material = new THREE.SpriteMaterial({
            map: texture,
            depthTest: false, // Render on top
            depthWrite: false,
            sizeAttenuation: true // Scale with distance (optional, adjust as needed)
        });
        this.sprite = new THREE.Sprite(material);
        // Make billboard smaller
        this.sprite.scale.set(1 / 3, 0.5 / 3, 1);
        this.sprite.position.set(0, 0, 0);
        this.sprite.visible = false;
        this.sprite.name = "interactionBillboard";
        this.sprite.renderOrder = 999; // Ensure it renders on top
    }

    /**
     * Gets the underlying THREE.Sprite object to add to the scene.
     */
    public getElement(): THREE.Sprite {
        return this.sprite;
    }

    /**
     * Updates the prompt's visibility and position based on a target object.
     * @param targetObject The object to position the prompt near (e.g., a doorknob), or null to hide.
     * @param verticalOffset How far above the target's center to place the prompt.
     */
    public update(targetObject: THREE.Object3D | null, verticalOffset: number = 0.3): void {
        if (targetObject) {
            targetObject.getWorldPosition(this.tempWorldPosition);
            this.sprite.position.copy(this.tempWorldPosition);
            this.sprite.position.y += verticalOffset;
            this.sprite.visible = true;
        } else {
            this.sprite.visible = false;
        }
    }

    public show(): void {
        this.sprite.visible = true;
    }

    public hide(): void {
        this.sprite.visible = false;
    }

    public setPosition(position: THREE.Vector3): void {
        this.sprite.position.copy(position);
    }
}