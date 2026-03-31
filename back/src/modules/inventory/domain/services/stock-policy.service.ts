import { InventoryEntity } from '../entities/inventory.entity';

export class StockPolicyService {
  static assertCanDecrease(inventory: InventoryEntity, quantity: number): void {
    if (inventory.props.allowNegativeStock) {
      return;
    }

    if (inventory.availableAfter(quantity) < 0) {
      throw new Error('Insufficient stock');
    }
  }

  static assertNonNegativeThreshold(threshold: number): void {
    if (!Number.isInteger(threshold) || threshold < 0) {
      throw new Error('Low stock threshold must be a non-negative integer');
    }
  }
}
