# Feature: Smart Inventory & Stock Management System

## Problem
El ecommerce actual no tiene un sistema robusto de gestión de inventario, lo que puede generar:
- Sobreventa de productos
- Pérdida de ventas por stock desactualizado
- Falta de trazabilidad en movimientos de inventario
- Dificultad para escalar a múltiples bodegas

## Goals
- Garantizar consistencia del inventario en tiempo real
- Permitir gestión multi-bodega
- Tener trazabilidad completa de movimientos
- Generar alertas automáticas de bajo stock

## Users
- Admin (gestiona todo el sistema)
- Inventory Manager (opera inventario)
- Customer (impactado indirectamente)

## Functional Requirements

### Inventory
- Cada producto debe tener stock por bodega
- El stock se debe actualizar automáticamente al:
  - Crear orden
  - Confirmar pago
  - Cancelar orden

### Stock Movements
- Registrar cada movimiento:
  - Entrada (compra, ajuste)
  - Salida (venta, pérdida)
- Guardar:
  - tipo
  - cantidad
  - fecha
  - usuario responsable
  - referencia (orden, ajuste, etc.)

### Multi-Warehouse
- Soporte para múltiples bodegas
- Transferencias entre bodegas

### Alerts
- Alertas cuando el stock sea menor a un umbral
- Notificaciones internas (y futuro: WhatsApp/email)

### Audit
- Historial completo de cambios de inventario
- No permitir inconsistencias

## Non-Functional Requirements
- Consistencia de datos (transacciones DB)
- Escalable (modular NestJS)
- Uso de colas (BullMQ + Redis)
- API REST estructurada
- Seguridad con RBAC

## Non-Goals (Fase futura)
- Predicción con IA
- Optimización automática de inventario
