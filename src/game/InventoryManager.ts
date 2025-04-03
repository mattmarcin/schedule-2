/**
 * Manages the basic inventory UI elements.
 */
export class InventoryManager {
    private uiContainer: HTMLElement;
    private slots: HTMLElement[] = [];
    private maxSlots: number;
    private selectedSlotIndex: number | null = null; // Track selected slot

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
            slotElement.dataset.slotIndex = i.toString();
            // Add inner element for icon background
            const iconElement = document.createElement('div');
            iconElement.classList.add('inventory-slot-icon');
            slotElement.appendChild(iconElement);

            this.uiContainer.appendChild(slotElement);
            this.slots.push(slotElement);
        }
    }

    /**
     * Sets the icon for a specific inventory slot.
     * @param slotIndex The index of the slot (0-based).
     * @param iconUrl The URL of the icon image (relative to public folder or absolute).
     */
    public setItemIcon(slotIndex: number, iconUrl: string | null): void {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            console.warn(`Invalid slot index for setItemIcon: ${slotIndex}`);
            return;
        }
        const slot = this.slots[slotIndex];
        const iconElement = slot.querySelector('.inventory-slot-icon') as HTMLElement;
        if (iconElement) {
            if (iconUrl) {
                iconElement.style.backgroundImage = `url(${iconUrl})`;
                iconElement.style.display = 'block';
            } else {
                iconElement.style.backgroundImage = 'none';
                iconElement.style.display = 'none';
            }
        }
    }

    /**
     * Selects an inventory slot, highlighting it and unhighlighting others.
     * @param slotIndex The index of the slot to select (0-based), or null to deselect all.
     */
    public selectSlot(slotIndex: number | null): void {
        // Deselect previous slot
        if (this.selectedSlotIndex !== null && this.slots[this.selectedSlotIndex]) {
            this.slots[this.selectedSlotIndex].classList.remove('selected');
        }

        // Select new slot
        if (slotIndex !== null && slotIndex >= 0 && slotIndex < this.slots.length) {
            this.slots[slotIndex].classList.add('selected');
            this.selectedSlotIndex = slotIndex;
        } else {
            this.selectedSlotIndex = null; // Deselected all
        }
    }

    public getSelectedSlotIndex(): number | null {
        return this.selectedSlotIndex;
    }

    // --- Future methods ---
    // addItem(itemData, slotIndex) { ... } // Would likely call setItemIcon
    // removeItem(slotIndex) { ... } // Would likely call setItemIcon(index, null)
}