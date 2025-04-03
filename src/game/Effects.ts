import * as THREE from 'three';

/**
 * Creates a simple smoke particle effect using THREE.Points.
 */
export function createSmokeEffect(
    position: THREE.Vector3,
    scene: THREE.Scene,
    duration: number = 2000
): void {
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = position.x;
        positions[i3 + 1] = position.y;
        positions[i3 + 2] = position.z;
        velocities[i3] = (Math.random() - 0.5) * 0.2; // X spread
        velocities[i3 + 1] = Math.random() * 0.5 + 0.3; // Y upward velocity
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.2; // Z spread
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(particles, particleMaterial);
    particleSystem.name = "smokeEffect";
    scene.add(particleSystem);

    const startTime = Date.now();
    const clock = new THREE.Clock();

    function animateSmoke() {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > duration) {
            scene.remove(particleSystem);
            particles.dispose();
            particleMaterial.dispose();
            return;
        }
        const delta = clock.getDelta();
        const currentPositions = particles.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            currentPositions.array[i3] += velocities[i3] * delta;
            currentPositions.array[i3 + 1] += velocities[i3 + 1] * delta;
            currentPositions.array[i3 + 2] += velocities[i3 + 2] * delta;
            velocities[i3 + 1] -= 0.1 * delta; // Gravity/drag
        }
        particleMaterial.opacity = 0.6 * (1 - elapsedTime / duration);
        currentPositions.needsUpdate = true;
        requestAnimationFrame(animateSmoke);
    }
    requestAnimationFrame(animateSmoke);
}


/**
 * Creates a simple cash particle effect (green squares) flying towards a target.
 * @param startPosition World position where particles originate (e.g., NPC).
 * @param targetPosition World position where particles fly towards (e.g., player camera).
 * @param scene The scene to add the effect to.
 * @param duration How long the effect should last in milliseconds.
 */
export function createCashEffect(
    startPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    scene: THREE.Scene,
    duration: number = 1500 // Default 1.5 seconds
): void {
    const particleCount = 20; // Fewer particles for cash
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    // We don't need complex velocity, just interpolate towards target

    // Use a square texture or just colored squares
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00ff00, // Green for cash
        size: 0.08,
        // map: cashTexture, // Optional: Load a '$' texture
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });

    // Initial positions spread slightly around the start position
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = startPosition.x + (Math.random() - 0.5) * 0.1;
        positions[i3 + 1] = startPosition.y + (Math.random() - 0.5) * 0.1;
        positions[i3 + 2] = startPosition.z + (Math.random() - 0.5) * 0.1;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(particles, particleMaterial);
    particleSystem.name = "cashEffect";
    scene.add(particleSystem);

    const startTime = Date.now();
    const startPositions = new Float32Array(positions); // Copy initial positions

    function animateCash() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(1.0, elapsedTime / duration); // Normalized time (0 to 1)

        if (progress >= 1.0) {
            scene.remove(particleSystem);
            particles.dispose();
            particleMaterial.dispose();
            return; // Stop animation
        }

        const currentPositions = particles.getAttribute('position') as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Interpolate position from start towards target
            currentPositions.array[i3] = THREE.MathUtils.lerp(startPositions[i3], targetPosition.x, progress);
            currentPositions.array[i3 + 1] = THREE.MathUtils.lerp(startPositions[i3 + 1], targetPosition.y, progress);
            currentPositions.array[i3 + 2] = THREE.MathUtils.lerp(startPositions[i3 + 2], targetPosition.z, progress);
        }

        // Fade out effect towards the end
        particleMaterial.opacity = 0.9 * (1 - progress);

        currentPositions.needsUpdate = true;
        requestAnimationFrame(animateCash);
    }
    requestAnimationFrame(animateCash);
}