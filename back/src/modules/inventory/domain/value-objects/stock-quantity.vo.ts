export class StockQuantity {
  private constructor(readonly value: number) {}

  static from(value: number): StockQuantity {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    return new StockQuantity(value);
  }
}
