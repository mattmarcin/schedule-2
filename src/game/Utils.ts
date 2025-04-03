import * as THREE from 'three';

/**
 * Creates a canvas texture with text.
 */
function createTextTexture(text: string, fontSize = 48, fontFace = 'Arial', textColor = 'rgba(255, 255, 255, 1.0)'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error("Could not get 2D context from canvas");
    }

    // Measure text to size canvas
    context.font = `${fontSize}px ${fontFace}`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Approximate height

    // Size canvas slightly larger than text
    canvas.width = textWidth + 10; // Add some padding
    canvas.height = textHeight + 10;

    // Re-apply font settings after resize
    context.font = `${fontSize}px ${fontFace}`;
    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw text centered
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Creates a billboard sprite for interaction prompts.
 */
export function createInteractionBillboard(): THREE.Sprite {
    const texture = createTextTexture('Click to Interact');
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }); // depthTest false to render on top
    const sprite = new THREE.Sprite(material);
    // Make billboard smaller (approx 1/3rd of original size)
    sprite.scale.set(1 / 3, 0.5 / 3, 1); // Adjust scale as needed
    sprite.position.set(0, 0, 0); // Initial position
    sprite.visible = false; // Initially hidden
    sprite.name = "interactionBillboard";
    // Render on top of other objects
    sprite.renderOrder = 999;
    material.depthTest = false;
    material.depthWrite = false;


    return sprite;
}