# Target Market: Colombia

## Market Context

Nexstore is designed with the Colombian market as the primary focus, while maintaining architecture for international expansion.

## Localization Features

### Language
- **UI Language**: Spanish for all customer-facing interfaces
- **Documentation**: English for technical docs, Spanish for user guides
- **Error Messages**: Spanish with technical codes for support

### Payment Methods

**Primary**: MercadoPago
- Local credit/debit cards
- PSE (Pagos Seguros en Línea)
- Efecty / Baloto (cash payment networks)
- MercadoPago wallet

**Configuration**: `MP_ACCESS_TOKEN` in environment variables

### Shipping & Logistics

**Country Model Features**:
```prisma
model Country {
  isoCode          String?  // CO for Colombia
  currency         String   // COP default
  shippingBaseCost Float    // Configurable by market
  etaDays          Int      // Default 7 days
  allowsShipping   Boolean
  allowsPurchase   Boolean
}
```

**Colombia-Specific Defaults**:
- Currency: COP (Colombian Peso)
- Default shipping cost: 0 (free shipping promotion common)
- ETA: 7 days (adjustable per region)

### Tax Configuration

- **Default Tax Rate**: 15% (IVA Colombia)
- **Environment Variable**: `TAX_RATE=0.15`
- **Calculation**: Applied to subtotal at checkout

## International Expansion Ready

While focused on Colombia, the architecture supports:

- Multi-currency (USD, COP, MXN, etc.)
- Country-based shipping rules
- Region-specific payment providers
- Language i18n (structure ready, Spanish implemented)

## Market Considerations

### Ecommerce Landscape Colombia
- High mobile usage (>70% of traffic)
- Cash payment preference (Efecty/Baloto)
- Social commerce integration potential
- Growing demand for same-day delivery

### Nexstore Adaptations
- Mobile-first responsive design (Tailwind + HeroUI)
- MercadoPago for local payment coverage
- Inventory system ready for multiple city warehouses
- Performance optimized for 3G/4G networks
