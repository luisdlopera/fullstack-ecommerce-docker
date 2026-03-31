import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import type { InventoryMovementType } from '@prisma/client';
import { Auth } from '../../../../shared/infrastructure/auth/auth.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { PERMISSIONS } from '../../../../shared/infrastructure/auth/permissions';
import { InventoryService } from '../../application/inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Controller('admin/inventory')
export class InventoryController {
  constructor(
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService,
  ) {}

  // ─── Summary ─────────────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('summary')
  getSummary() {
    return this.inventoryService.getInventorySummary();
  }

  // ─── List Items ──────────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('items')
  listItems(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('lowStock', new ParseBoolPipe({ optional: true })) lowStock?: boolean,
    @Query('outOfStock', new ParseBoolPipe({ optional: true })) outOfStock?: boolean,
    @Query('productId') productId?: string,
    @Query('location') location?: string,
  ) {
    return this.inventoryService.listItems(page, limit, search, lowStock, outOfStock, productId, location);
  }

  // ─── Get Item ────────────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('items/:id')
  getItemById(@Param('id') id: string) {
    return this.inventoryService.getItemById(id);
  }

  // ─── Items by Product ────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('products/:productId')
  getItemsByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getItemsByProductId(productId);
  }

  // ─── Adjust Inventory ────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('items/:id/adjust')
  adjustInventory(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.adjustInventory(id, dto.quantity, dto.reason, user.sub);
  }

  // ─── Movements ───────────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('movements')
  listMovements(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('type') type?: InventoryMovementType,
    @Query('referenceId') referenceId?: string,
  ) {
    return this.inventoryService.listMovements(page, limit, inventoryItemId, type, referenceId);
  }

  // ─── Alerts ──────────────────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('alerts/low-stock')
  getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('alerts/out-of-stock')
  getOutOfStockItems() {
    return this.inventoryService.getOutOfStockItems();
  }
}
