import * as THREE from 'three';

/**
 * Manages loading and playing audio using THREE.AudioListener and THREE.Audio.
 */
export class AudioManager {
    private listener: THREE.AudioListener;
    private sounds: Map<string, THREE.Audio> = new Map();
    private audioLoader: THREE.AudioLoader;

    constructor(camera: THREE.Camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener); // Attach listener to camera
        this.audioLoader = new THREE.AudioLoader();
    }

    /**
     * Loads a sound effect and stores it for later playback.
     * @param key A unique key to identify the sound.
     * @param url The path to the audio file (e.g., '/audio/sound.mp3').
     * @param loop Whether the sound should loop (default: false).
     * @param volume The volume (0-1, default: 0.5).
     */
    public loadSound(key: string, url: string, loop: boolean = false, volume: number = 0.5): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.sounds.has(key)) {
                console.warn(`Sound with key "${key}" already loaded.`);
                resolve();
                return;
            }

            this.audioLoader.load(
                url,
                (buffer) => {
                    const sound = new THREE.Audio(this.listener);
                    sound.setBuffer(buffer);
                    sound.setLoop(loop);
                    sound.setVolume(volume);
                    this.sounds.set(key, sound);
                    console.log(`Sound loaded: ${key} (${url})`);
                    resolve();
                },
                undefined, // onProgress callback (optional)
                (error) => {
                    console.error(`Error loading sound ${key} from ${url}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Plays a pre-loaded sound.
     * @param key The key of the sound to play.
     */
    public playSound(key: string): void {
        const sound = this.sounds.get(key);
        if (sound) {
            // Stop the sound first if it might already be playing (prevents overlap issues)
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.play();
        } else {
            console.warn(`Sound with key "${key}" not found or not loaded.`);
        }
    }

    /**
     * Stops a specific sound if it's playing.
     * @param key The key of the sound to stop.
     */
    public stopSound(key: string): void {
         const sound = this.sounds.get(key);
         if (sound && sound.isPlaying) {
             sound.stop();
         }
    }
}