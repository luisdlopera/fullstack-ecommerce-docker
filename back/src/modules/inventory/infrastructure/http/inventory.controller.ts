import { Body, Controller, Get, Inject, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Auth } from '../../../../shared/infrastructure/auth/auth.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { PERMISSIONS } from '../../../../shared/infrastructure/auth/permissions';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AdjustStockUseCase } from '../../application/use-cases/adjust-stock.use-case';
import { CreateWarehouseUseCase } from '../../application/use-cases/create-warehouse.use-case';
import { DecreaseStockUseCase } from '../../application/use-cases/decrease-stock.use-case';
import { GetInventoryByProductUseCase } from '../../application/use-cases/get-inventory-by-product.use-case';
import { GetInventoryByWarehouseUseCase } from '../../application/use-cases/get-inventory-by-warehouse.use-case';
import { GetStockMovementsUseCase } from '../../application/use-cases/get-stock-movements.use-case';
import { IncreaseStockUseCase } from '../../application/use-cases/increase-stock.use-case';
import { ReleaseStockUseCase } from '../../application/use-cases/release-stock.use-case';
import { ReserveStockUseCase } from '../../application/use-cases/reserve-stock.use-case';
import { TransferStockUseCase } from '../../application/use-cases/transfer-stock.use-case';
import { ValidateAvailableStockUseCase } from '../../application/use-cases/validate-available-stock.use-case';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { DecreaseStockDto } from './dto/decrease-stock.dto';
import { GetStockMovementsQueryDto } from './dto/get-stock-movements-query.dto';
import { IncreaseStockDto } from './dto/increase-stock.dto';
import { ReleaseStockDto } from './dto/release-stock.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { InventoryMovementType } from '../../domain/enums/inventory-movement-type.enum';

@Controller(['inventory', 'admin/inventory'])
export class InventoryController {
  constructor(
    @Inject(GetInventoryByProductUseCase)
    private readonly getInventoryByProductUseCase: GetInventoryByProductUseCase,
    @Inject(GetInventoryByWarehouseUseCase)
    private readonly getInventoryByWarehouseUseCase: GetInventoryByWarehouseUseCase,
    @Inject(GetStockMovementsUseCase)
    private readonly getStockMovementsUseCase: GetStockMovementsUseCase,
    @Inject(IncreaseStockUseCase)
    private readonly increaseStockUseCase: IncreaseStockUseCase,
    @Inject(DecreaseStockUseCase)
    private readonly decreaseStockUseCase: DecreaseStockUseCase,
    @Inject(AdjustStockUseCase)
    private readonly adjustStockUseCase: AdjustStockUseCase,
    @Inject(TransferStockUseCase)
    private readonly transferStockUseCase: TransferStockUseCase,
    @Inject(ReserveStockUseCase)
    private readonly reserveStockUseCase: ReserveStockUseCase,
    @Inject(ReleaseStockUseCase)
    private readonly releaseStockUseCase: ReleaseStockUseCase,
    @Inject(ValidateAvailableStockUseCase)
    private readonly validateAvailableStockUseCase: ValidateAvailableStockUseCase,
    @Inject(CreateWarehouseUseCase)
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('summary')
  async getSummary() {
    const [totals, outOfStockCount, lowStockRows, committed] = await this.prisma.$transaction([
      this.prisma.inventory.aggregate({
        _count: true,
        _sum: {
          availableQuantity: true,
          reservedQuantity: true,
        },
      }),
      this.prisma.inventory.count({ where: { availableQuantity: 0 } }),
      this.prisma.inventory.findMany({
        where: { availableQuantity: { gt: 0 } },
        select: { availableQuantity: true, lowStockThreshold: true },
      }),
      this.prisma.stockMovement.aggregate({
        where: { type: 'COMMIT' },
        _sum: { quantity: true },
      }),
    ]);

    return {
      totalItems: totals._count,
      totalAvailable: totals._sum.availableQuantity ?? 0,
      totalReserved: totals._sum.reservedQuantity ?? 0,
      totalCommitted: committed._sum.quantity ?? 0,
      lowStockCount: lowStockRows.filter((row) => row.availableQuantity <= row.lowStockThreshold).length,
      outOfStockCount,
    };
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('items')
  async listItems(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('lowStock', new ParseBoolPipe({ optional: true })) lowStock?: boolean,
    @Query('outOfStock', new ParseBoolPipe({ optional: true })) outOfStock?: boolean,
    @Query('productId') productId?: string,
    @Query('location') location?: string,
  ) {
    const safePage = Math.max(page ?? 1, 1);
    const safeLimit = Math.min(Math.max(limit ?? 20, 1), 100);

    const baseWhere: Record<string, unknown> = {};

    if (productId) {
      baseWhere.productId = productId;
    }

    if (search) {
      baseWhere.OR = [
        { product: { title: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (outOfStock) {
      baseWhere.availableQuantity = 0;
    }

    if (location) {
      baseWhere.warehouse = {
        OR: [
          { code: { contains: location, mode: 'insensitive' } },
          { name: { contains: location, mode: 'insensitive' } },
        ],
      };
    }

    const rows = await this.prisma.inventory.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            sku: true,
            isActive: true,
            ProductImage: {
              select: { id: true, url: true, isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    const filteredRows = lowStock
      ? rows.filter((row) => row.availableQuantity > 0 && row.availableQuantity <= row.lowStockThreshold)
      : rows;

    const start = (safePage - 1) * safeLimit;
    const pagedRows = filteredRows.slice(start, start + safeLimit);

    return {
      data: pagedRows.map((row) => this.toLegacyInventoryItem(row)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total: filteredRows.length,
        totalPages: Math.max(Math.ceil(filteredRows.length / safeLimit), 1),
      },
    };
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('items/:id')
  async getItemById(@Param('id') id: string) {
    const row = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            sku: true,
            isActive: true,
            ProductImage: {
              select: { id: true, url: true, isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    return this.toLegacyInventoryItem(row);
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('items/:id/adjust')
  async adjustInventoryLegacy(@Param('id') id: string, @Body() dto: { quantity: number; reason: string }, @CurrentUser() user: JwtPayload) {
    const row = await this.prisma.inventory.findUnique({ where: { id } });
    if (!row) {
      return null;
    }

    await this.adjustStockUseCase.execute({
      productId: row.productId,
      warehouseId: row.warehouseId,
      quantity: dto.quantity,
      note: dto.reason,
      reference: `manual-adjustment:${id}`,
      userId: user.sub,
    });

    const updated = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            sku: true,
            isActive: true,
            ProductImage: {
              select: { id: true, url: true, isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!updated) {
      return null;
    }

    return this.toLegacyInventoryItem(updated);
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('alerts/low-stock')
  async getLowStockItems() {
    const rows = await this.prisma.inventory.findMany({
      where: { availableQuantity: { gt: 0 } },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            sku: true,
            isActive: true,
            ProductImage: {
              select: { id: true, url: true, isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .filter((row) => row.availableQuantity <= row.lowStockThreshold)
      .map((row) => this.toLegacyInventoryItem(row));
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('alerts/out-of-stock')
  async getOutOfStockItems() {
    const rows = await this.prisma.inventory.findMany({
      where: { availableQuantity: 0 },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            sku: true,
            isActive: true,
            ProductImage: {
              select: { id: true, url: true, isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toLegacyInventoryItem(row));
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('products/:productId')
  async getInventoryByProduct(@Param('productId') productId: string) {
    const rows = await this.prisma.inventory.findMany({
      where: { productId },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            sku: true,
            isActive: true,
            ProductImage: {
              select: { id: true, url: true, isPrimary: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toLegacyInventoryItem(row));
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('warehouses/:warehouseId')
  getInventoryByWarehouse(@Param('warehouseId') warehouseId: string) {
    return this.getInventoryByWarehouseUseCase.execute(warehouseId);
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('movements')
  async getStockMovements(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('type') type?: InventoryMovementType | 'RESERVATION' | 'RETURN',
    @Query('referenceId') referenceId?: string,
    @Query() query?: GetStockMovementsQueryDto,
  ) {
    const requestedType = type ?? query?.type;
    const normalizedType =
      requestedType === 'RESERVATION'
        ? InventoryMovementType.RESERVE
        : requestedType === 'RETURN'
          ? undefined
          : requestedType;

    const pageValue = page ?? query?.page ?? 1;
    const limitValue = limit ?? query?.limit ?? 20;

    const result = await this.getStockMovementsUseCase.execute({
      page: pageValue,
      limit: limitValue,
      productId: query?.productId,
      warehouseId: query?.warehouseId,
      reference: referenceId ?? query?.reference,
      type: normalizedType,
    });

    const rows = await this.prisma.inventory.findMany({
      where: {
        id: { in: result.data.map((row) => row.inventoryId) },
      },
      include: { warehouse: true },
    });

    const byInventoryId = new Map(rows.map((row) => [row.id, row]));

    const filteredData = inventoryItemId
      ? result.data.filter((row) => row.inventoryId === inventoryItemId)
      : result.data;

    return {
      data: filteredData.map((row) => {
        const inventory = byInventoryId.get(row.inventoryId);
        const legacyType = row.type === InventoryMovementType.RESERVE ? 'RESERVATION' : row.type;
        return {
          id: row.id,
          inventoryItemId: row.inventoryId,
          type: legacyType,
          quantity: row.quantity,
          reason: row.note ?? row.reference ?? 'No reason provided',
          referenceType: null,
          referenceId: row.reference,
          userId: row.userId,
          createdAt: row.createdAt,
          inventoryItem: {
            id: row.inventoryId,
            productId: row.productId,
            size: 'N/A',
            location: inventory?.warehouse.code ?? inventory?.warehouse.name ?? 'MAIN',
            product: {
              id: row.productId,
              title: 'Product',
              sku: null,
            },
          },
        };
      }),
      meta: {
        page: pageValue,
        limit: limitValue,
        total: inventoryItemId ? filteredData.length : result.total,
        totalPages: Math.max(Math.ceil((inventoryItemId ? filteredData.length : result.total) / limitValue), 1),
      },
    };
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('increase')
  @Post('increase')
  increaseStock(@Body() dto: IncreaseStockDto, @CurrentUser() user: JwtPayload) {
    return this.increaseStockUseCase.execute({ ...dto, userId: user.sub });
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('decrease')
  @Post('decrease')
  decreaseStock(@Body() dto: DecreaseStockDto, @CurrentUser() user: JwtPayload) {
    return this.decreaseStockUseCase.execute({ ...dto, userId: user.sub });
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('adjust')
  @Post('adjust')
  adjustStock(@Body() dto: CreateInventoryAdjustmentDto, @CurrentUser() user: JwtPayload) {
    return this.adjustStockUseCase.execute({ ...dto, userId: user.sub });
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('transfer')
  @Post('transfer')
  transferStock(@Body() dto: TransferStockDto, @CurrentUser() user: JwtPayload) {
    return this.transferStockUseCase.execute({ ...dto, userId: user.sub });
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('reserve')
  @Post('reserve')
  reserveStock(@Body() dto: ReserveStockDto, @CurrentUser() user: JwtPayload) {
    return this.reserveStockUseCase.execute({ ...dto, userId: user.sub });
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('release')
  @Post('release')
  releaseStock(@Body() dto: ReleaseStockDto, @CurrentUser() user: JwtPayload) {
    return this.releaseStockUseCase.execute({ ...dto, userId: user.sub });
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('products/:productId/warehouses/:warehouseId/availability')
  validateStock(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
    @Query('quantity') quantity: string,
  ) {
    return this.validateAvailableStockUseCase.execute(productId, warehouseId, Number(quantity));
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('warehouses')
  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.createWarehouseUseCase.execute(dto);
  }

  private toLegacyInventoryItem(row: {
    id: string;
    productId: string;
    availableQuantity: number;
    reservedQuantity: number;
    lowStockThreshold: number;
    createdAt: Date;
    updatedAt: Date;
    warehouse: { code: string; name: string };
    product: {
      id: string;
      title: string;
      slug: string;
      sku: string | null;
      isActive: boolean;
      ProductImage: Array<{ id: number; url: string; isPrimary: boolean }>;
    };
  }) {
    return {
      id: row.id,
      productId: row.productId,
      size: 'N/A',
      location: row.warehouse.code || row.warehouse.name,
      available: row.availableQuantity,
      reserved: row.reservedQuantity,
      committed: 0,
      minStock: row.lowStockThreshold,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      product: row.product,
    };
  }
}
