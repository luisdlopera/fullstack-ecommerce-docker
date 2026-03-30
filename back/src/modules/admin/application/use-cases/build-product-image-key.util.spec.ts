import { buildProductImageKey } from './build-product-image-key.util';

describe('buildProductImageKey', () => {
  it('creates deterministic safe path shape with normalized extension', () => {
    const key = buildProductImageKey('Product_ABC-123', 'JPG');

    expect(key).toMatch(/^products\/product_abc-123\/\d{4}\/\d{2}\/[0-9a-f-]+\.jpg$/);
  });

  it('generates different keys to avoid collisions', () => {
    const first = buildProductImageKey('p1', 'png');
    const second = buildProductImageKey('p1', 'png');

    expect(first).not.toBe(second);
  });
});
