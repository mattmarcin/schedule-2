/**
 * Manages the basic inventory UI elements.
 */
export class InventoryManager {
    private uiContainer: HTMLElement;
    private slots: HTMLElement[] = [];
    private maxSlots: number;

    constructor(containerId: string = 'inventory-ui', numSlots: number = 5) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Inventory UI container with id "${containerId}" not found.`);
        }
        this.uiContainer = container;
        this.maxSlots = numSlots;

        this.createSlots();
    }

    private createSlots(): void {
        this.uiContainer.innerHTML = ''; // Clear existing slots if any
        this.slots = [];
        for (let i = 0; i < this.maxSlots; i++) {
            const slotElement = document.createElement('div');
            slotElement.classList.add('inventory-slot');
            slotElement.dataset.slotIndex = i.toString(); // Store index if needed later
            this.uiContainer.appendChild(slotElement);
            this.slots.push(slotElement);
        }
    }

    // --- Future methods ---
    // addItem(itemData, slotIndex) { ... }
    // removeItem(slotIndex) { ... }
    // highlightSlot(slotIndex) { ... }
    // etc.
}