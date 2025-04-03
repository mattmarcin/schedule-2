/**
 * Manages the basic inventory UI elements, including item counts.
 */
export class InventoryManager {
    private uiContainer: HTMLElement;
    private slots: HTMLElement[] = [];
    private slotData: { icon: string | null, count: number }[] = []; // Store icon and count
    private maxSlots: number;
    private selectedSlotIndex: number | null = null;

    constructor(containerId: string = 'inventory-ui', numSlots: number = 5) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Inventory UI container with id "${containerId}" not found.`);
        }
        this.uiContainer = container;
        this.maxSlots = numSlots;

        // Initialize slot data
        for (let i = 0; i < numSlots; i++) {
            this.slotData.push({ icon: null, count: 0 });
        }

        this.createSlots();
    }

    private createSlots(): void {
        this.uiContainer.innerHTML = ''; // Clear existing slots
        this.slots = [];
        for (let i = 0; i < this.maxSlots; i++) {
            const slotElement = document.createElement('div');
            slotElement.classList.add('inventory-slot');
            slotElement.dataset.slotIndex = i.toString();

            // Icon element
            const iconElement = document.createElement('div');
            iconElement.classList.add('inventory-slot-icon');
            slotElement.appendChild(iconElement);

            // Count element
            const countElement = document.createElement('div');
            countElement.classList.add('inventory-slot-count');
            slotElement.appendChild(countElement);

            this.uiContainer.appendChild(slotElement);
            this.slots.push(slotElement);
            this.updateSlotVisuals(i); // Update visuals based on initial data
        }
    }

    /** Updates the visual appearance (icon, count) of a single slot */
    private updateSlotVisuals(slotIndex: number): void {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return;

        const slot = this.slots[slotIndex];
        const data = this.slotData[slotIndex];
        const iconElement = slot.querySelector('.inventory-slot-icon') as HTMLElement;
        const countElement = slot.querySelector('.inventory-slot-count') as HTMLElement;

        if (iconElement) {
            // Only show icon if icon URL exists AND count is greater than 0
            if (data.icon && data.count > 0) {
                iconElement.style.backgroundImage = `url(${data.icon})`;
                iconElement.style.display = 'block';
            } else {
                iconElement.style.backgroundImage = 'none';
                iconElement.style.display = 'none'; // Hide icon if no icon URL or count is 0
            }
        }
        if (countElement) {
            // Show count if it's greater than 0
            if (data.count > 0) {
                countElement.textContent = data.count.toString();
                countElement.style.display = 'block';
            } else {
                countElement.textContent = '';
                countElement.style.display = 'none'; // Hide count if 0
            }
        }
    }

    /**
     * Sets the item (icon and count) for a specific inventory slot.
     * Use count = 0 or iconUrl = null to clear the slot.
     */
    public setItem(slotIndex: number, iconUrl: string | null, count: number = 1): void {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            console.warn(`Invalid slot index for setItem: ${slotIndex}`);
            return;
        }
        this.slotData[slotIndex] = {
            icon: iconUrl, // Always store the icon URL if provided
            count: count
        };
        this.updateSlotVisuals(slotIndex);
    }

    /** Adds to the count of an item in a slot. Assumes item type matches. */
    public addItemCount(slotIndex: number, amount: number = 1): void {
         if (slotIndex < 0 || slotIndex >= this.slots.length) {
            console.warn(`Invalid slot index for addItemCount: ${slotIndex}`);
            return;
        }
        // Check if the slot is defined to hold *something* (has an icon)
        if (this.slotData[slotIndex].icon) {
            this.slotData[slotIndex].count += amount;
            // Ensure count doesn't go below zero if amount is negative (though not used yet)
            if (this.slotData[slotIndex].count < 0) {
                this.slotData[slotIndex].count = 0;
            }
            this.updateSlotVisuals(slotIndex);
        } else {
            console.warn(`Cannot add count to slot ${slotIndex} as it has no item icon defined.`);
        }
    }

    /** Gets the current count of items in a slot */
    public getItemCount(slotIndex: number): number {
         if (slotIndex < 0 || slotIndex >= this.slots.length) return 0;
         return this.slotData[slotIndex].count;
    }

    /** Selects an inventory slot */
    public selectSlot(slotIndex: number | null): void {
        if (this.selectedSlotIndex !== null && this.slots[this.selectedSlotIndex]) {
            this.slots[this.selectedSlotIndex].classList.remove('selected');
        }
        if (slotIndex !== null && slotIndex >= 0 && slotIndex < this.slots.length) {
            this.slots[slotIndex].classList.add('selected');
            this.selectedSlotIndex = slotIndex;
        } else {
            this.selectedSlotIndex = null;
        }
    }

    public getSelectedSlotIndex(): number | null {
        return this.selectedSlotIndex;
    }
}