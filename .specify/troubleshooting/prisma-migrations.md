# Troubleshooting: Prisma Migrations

## Error P3009: Failed Migrations

### Síntoma
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `0001_init` migration started at 2026-04-03 18:14:12.737022 UTC failed
```

### Causa
Una migración anterior falló y quedó marcada como "fallida" en la base de datos, bloqueando nuevas migraciones.

### Solución para Desarrollo (Local)

#### Opción 1: Marcar como rollback y resetear (Recomendado)
```bash
cd back

# 1. Ver estado de migraciones
npx prisma migrate status

# 2. Marcar la migración fallida como rolled back
npx prisma migrate resolve --rolled-back "0001_init"

# 3. Resetear la base de datos y re-aplicar migraciones
npx prisma migrate reset --force
```

#### Opción 2: Si ya aplicaste cambios manualmente (Hotfix)
```bash
cd back

# Marcar la migración como aplicada manualmente
npx prisma migrate resolve --applied "0001_init"
```

### Solución para Producción
**NO uses `migrate reset` en producción** - borra todos los datos.

```bash
# 1. Identificar el problema
npx prisma migrate status

# 2. Si la migración ya fue arreglada manualmente en la DB
npx prisma migrate resolve --applied "NOMBRE_MIGRACION"

# 3. O si necesitas revertirla manualmente primero
npx prisma migrate resolve --rolled-back "NOMBRE_MIGRACION"
```

### Comandos Útiles de Diagnóstico

```bash
# Ver estado detallado de migraciones
npx prisma migrate status

# Ver logs de migración
npx prisma migrate deploy --verbose

# Generar cliente Prisma (después de migraciones OK)
npx prisma generate
```

### Prevención

1. **Nunca interrumpas una migración en curso** (Ctrl+C durante `migrate deploy`)
2. **Prueba migraciones en local antes de producción**
3. **Haz backup antes de migraciones en producción**

### Referencias
- [Prisma Migrate Troubleshooting](https://pris.ly/d/migrate-resolve)
- [Prisma Migrate Production Guide](https://pris.ly/d/migrate-production)
