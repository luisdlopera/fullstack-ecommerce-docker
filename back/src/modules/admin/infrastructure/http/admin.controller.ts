import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderStatus, PaymentStatus, Role, Gender } from '@prisma/client';
import { Auth } from '../../../../shared/infrastructure/auth/auth.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { PERMISSIONS } from '../../../../shared/infrastructure/auth/permissions';
import {
  GetHomeBannersUseCase,
  UploadHomeBannerUseCase,
  DeleteHomeBannerUseCase,
  UpdateHomeBannerUseCase,
  ReorderHomeBannersUseCase,
} from '../../../content/application/use-cases';
import { DeleteProductImageUseCase } from '../../application/use-cases/delete-product-image.use-case';
import { ReorderProductImagesUseCase } from '../../application/use-cases/reorder-product-images.use-case';
import { SetPrimaryProductImageUseCase } from '../../application/use-cases/set-primary-product-image.use-case';
import { UploadProductImageUseCase } from '../../application/use-cases/upload-product-image.use-case';
import { GetDashboardSummaryUseCase } from '../../application/use-cases/get-dashboard-summary.use-case';
import { GetSalesChartUseCase } from '../../application/use-cases/get-sales-chart.use-case';
import { GetRecentOrdersUseCase } from '../../application/use-cases/get-recent-orders.use-case';
import { GetTopProductsUseCase } from '../../application/use-cases/get-top-products.use-case';
import { GetUsersUseCase } from '../../application/use-cases/get-users.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { UpdateUserRoleUseCase } from '../../application/use-cases/update-user-role.use-case';
import { UpdateUserStatusUseCase } from '../../application/use-cases/update-user-status.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { GetOrdersUseCase } from '../../application/use-cases/get-orders.use-case';
import { GetOrderByIdUseCase } from '../../application/use-cases/get-order-by-id.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { UpdatePaymentStatusUseCase } from '../../application/use-cases/update-payment-status.use-case';
import { UpdateOrderNotesUseCase } from '../../application/use-cases/update-order-notes.use-case';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { UpdateProductStatusUseCase } from '../../application/use-cases/update-product-status.use-case';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { GetCategoryByIdUseCase } from '../../application/use-cases/get-category-by-id.use-case';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { GetCountriesUseCase } from '../../application/use-cases/get-countries.use-case';
import { CreateCountryUseCase } from '../../application/use-cases/create-country.use-case';
import { UpdateCountryUseCase } from '../../application/use-cases/update-country.use-case';
import { DeleteCountryUseCase } from '../../application/use-cases/delete-country.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateOrderStatusDto } from '../../../orders/infrastructure/http/dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdateOrderNotesDto } from './dto/update-order-notes.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { UpsertCountryDto } from './dto/upsert-country.dto';
import { UploadProductImageDto } from './dto/upload-product-image.dto';
import { ReorderProductImagesDto } from './dto/reorder-product-images.dto';
import { UpsertCollectionDto } from './dto/upsert-collection.dto';
import {
  GetCollectionsUseCase,
  GetCollectionByIdUseCase,
  CreateCollectionUseCase,
  UpdateCollectionUseCase,
  DeleteCollectionUseCase,
} from '../../application/use-cases/collection.use-cases';
import type { UploadFile } from '../../application/use-cases/upload-file.type';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(GetDashboardSummaryUseCase) private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    @Inject(GetSalesChartUseCase) private readonly getSalesChartUseCase: GetSalesChartUseCase,
    @Inject(GetRecentOrdersUseCase) private readonly getRecentOrdersUseCase: GetRecentOrdersUseCase,
    @Inject(GetTopProductsUseCase) private readonly getTopProductsUseCase: GetTopProductsUseCase,
    @Inject(GetUsersUseCase) private readonly getUsersUseCase: GetUsersUseCase,
    @Inject(GetUserByIdUseCase) private readonly getUserByIdUseCase: GetUserByIdUseCase,
    @Inject(CreateUserUseCase) private readonly createUserUseCase: CreateUserUseCase,
    @Inject(UpdateUserUseCase) private readonly updateUserUseCase: UpdateUserUseCase,
    @Inject(UpdateUserRoleUseCase) private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    @Inject(UpdateUserStatusUseCase) private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    @Inject(DeleteUserUseCase) private readonly deleteUserUseCase: DeleteUserUseCase,
    @Inject(GetOrdersUseCase) private readonly getOrdersUseCase: GetOrdersUseCase,
    @Inject(GetOrderByIdUseCase) private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    @Inject(UpdateOrderStatusUseCase) private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    @Inject(UpdatePaymentStatusUseCase) private readonly updatePaymentStatusUseCase: UpdatePaymentStatusUseCase,
    @Inject(UpdateOrderNotesUseCase) private readonly updateOrderNotesUseCase: UpdateOrderNotesUseCase,
    @Inject(GetProductsUseCase) private readonly getProductsUseCase: GetProductsUseCase,
    @Inject(GetProductByIdUseCase) private readonly getProductByIdUseCase: GetProductByIdUseCase,
    @Inject(CreateProductUseCase) private readonly createProductUseCase: CreateProductUseCase,
    @Inject(UpdateProductUseCase) private readonly updateProductUseCase: UpdateProductUseCase,
    @Inject(DeleteProductUseCase) private readonly deleteProductUseCase: DeleteProductUseCase,
    @Inject(UpdateProductStatusUseCase) private readonly updateProductStatusUseCase: UpdateProductStatusUseCase,
    @Inject(GetCategoriesUseCase) private readonly getCategoriesUseCase: GetCategoriesUseCase,
    @Inject(GetCategoryByIdUseCase) private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    @Inject(CreateCategoryUseCase) private readonly createCategoryUseCase: CreateCategoryUseCase,
    @Inject(UpdateCategoryUseCase) private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    @Inject(DeleteCategoryUseCase) private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    @Inject(GetCountriesUseCase) private readonly getCountriesUseCase: GetCountriesUseCase,
    @Inject(CreateCountryUseCase) private readonly createCountryUseCase: CreateCountryUseCase,
    @Inject(UpdateCountryUseCase) private readonly updateCountryUseCase: UpdateCountryUseCase,
    @Inject(DeleteCountryUseCase) private readonly deleteCountryUseCase: DeleteCountryUseCase,
    @Inject(UploadProductImageUseCase)
    private readonly uploadProductImageUseCase: UploadProductImageUseCase,
    @Inject(DeleteProductImageUseCase)
    private readonly deleteProductImageUseCase: DeleteProductImageUseCase,
    @Inject(ReorderProductImagesUseCase)
    private readonly reorderProductImagesUseCase: ReorderProductImagesUseCase,
    @Inject(SetPrimaryProductImageUseCase)
    private readonly setPrimaryProductImageUseCase: SetPrimaryProductImageUseCase,
    @Inject(GetHomeBannersUseCase)
    private readonly getHomeBannersUseCase: GetHomeBannersUseCase,
    @Inject(UploadHomeBannerUseCase)
    private readonly uploadHomeBannerUseCase: UploadHomeBannerUseCase,
    @Inject(DeleteHomeBannerUseCase)
    private readonly deleteHomeBannerUseCase: DeleteHomeBannerUseCase,
    @Inject(UpdateHomeBannerUseCase)
    private readonly updateHomeBannerUseCase: UpdateHomeBannerUseCase,
    @Inject(ReorderHomeBannersUseCase)
    private readonly reorderHomeBannersUseCase: ReorderHomeBannersUseCase,
    @Inject(GetCollectionsUseCase) private readonly getCollectionsUseCase: GetCollectionsUseCase,
    @Inject(GetCollectionByIdUseCase) private readonly getCollectionByIdUseCase: GetCollectionByIdUseCase,
    @Inject(CreateCollectionUseCase) private readonly createCollectionUseCase: CreateCollectionUseCase,
    @Inject(UpdateCollectionUseCase) private readonly updateCollectionUseCase: UpdateCollectionUseCase,
    @Inject(DeleteCollectionUseCase) private readonly deleteCollectionUseCase: DeleteCollectionUseCase,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  // ─── Dashboard ──────────────────────────────────────────────────────

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/summary')
  getDashboardSummary(@Query('period') period?: string) {
    return this.getDashboardSummaryUseCase.execute(period);
  }

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/sales-chart')
  getSalesChart(@Query('period') period?: string) {
    return this.getSalesChartUseCase.execute(period);
  }

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/recent-orders')
  getRecentOrders(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.getRecentOrdersUseCase.execute(limit);
  }

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/top-products')
  getTopProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.getTopProductsUseCase.execute(limit);
  }

  // ─── Users ──────────────────────────────────────────────────────────

  @Auth(PERMISSIONS.USERS_READ)
  @Get('users')
  getUsers(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    return this.getUsersUseCase.execute(page, limit, search, role, isActive, user.role);
  }

  @Auth(PERMISSIONS.USERS_READ)
  @Get('users/:id')
  getUserById(@Param('id') userId: string, @CurrentUser() user: JwtPayload) {
    return this.getUserByIdUseCase.execute(userId, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Post('users')
  createUser(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.createUserUseCase.execute(dto, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id')
  updateUser(@Param('id') userId: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    return this.updateUserUseCase.execute(userId, dto, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto, @CurrentUser() user: JwtPayload) {
    return this.updateUserRoleUseCase.execute(userId, dto, user.sub, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id/status')
  updateUserStatus(@Param('id') userId: string, @Body() dto: UpdateUserStatusDto, @CurrentUser() user: JwtPayload) {
    return this.updateUserStatusUseCase.execute(userId, dto.isActive, user.sub, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Delete('users/:id')
  deleteUser(@Param('id') userId: string, @CurrentUser() user: JwtPayload) {
    return this.deleteUserUseCase.execute(userId, user.sub, user.role);
  }

  // ─── Orders ─────────────────────────────────────────────────────────

  @Auth(PERMISSIONS.ORDERS_READ)
  @Get('orders')
  getOrders(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('paid', new ParseBoolPipe({ optional: true })) paid?: boolean,
  ) {
    return this.getOrdersUseCase.execute(page, limit, search, status, paymentStatus, paid);
  }

  @Auth(PERMISSIONS.ORDERS_READ)
  @Get('orders/:id')
  getOrderById(@Param('id') orderId: string) {
    return this.getOrderByIdUseCase.execute(orderId);
  }

  @Auth(PERMISSIONS.ORDERS_UPDATE)
  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') orderId: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: JwtPayload) {
    return this.updateOrderStatusUseCase.execute(orderId, dto.status, user.sub);
  }

  @Auth(PERMISSIONS.PAYMENTS_READ)
  @Patch('orders/:id/payment-status')
  updatePaymentStatus(@Param('id') orderId: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.updatePaymentStatusUseCase.execute(orderId, dto.paymentStatus);
  }

  @Auth(PERMISSIONS.ORDERS_UPDATE)
  @Patch('orders/:id/notes')
  updateOrderNotes(@Param('id') orderId: string, @Body() dto: UpdateOrderNotesDto) {
    return this.updateOrderNotesUseCase.execute(orderId, dto.internalNotes);
  }

  // ─── Products ───────────────────────────────────────────────────────

  @Auth(PERMISSIONS.PRODUCTS_READ)
  @Get('products')
  getProducts(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('inStock', new ParseBoolPipe({ optional: true })) inStock?: boolean,
  ) {
    return this.getProductsUseCase.execute(page, limit, search, categoryId, isActive, inStock);
  }

  @Auth(PERMISSIONS.PRODUCTS_READ)
  @Get('products/:id')
  getProductById(@Param('id') productId: string) {
    return this.getProductByIdUseCase.execute(productId);
  }

  @Auth(PERMISSIONS.PRODUCTS_CREATE)
  @Post('products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.createProductUseCase.execute(dto);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Patch('products/:id')
  updateProduct(@Param('id') productId: string, @Body() dto: UpsertProductDto) {
    return this.updateProductUseCase.execute(productId, dto);
  }

  @Auth(PERMISSIONS.PRODUCTS_DELETE)
  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string, @CurrentUser() user: JwtPayload) {
    return this.deleteProductUseCase.execute(productId, user.sub);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Patch('products/:id/status')
  updateProductStatus(@Param('id') productId: string, @Body('isActive', ParseBoolPipe) isActive: boolean) {
    return this.updateProductStatusUseCase.execute(productId, isActive);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Post('products/:id/images')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(
    @Param('id') productId: string,
    @UploadedFile() file: UploadFile | undefined,
    @Body() dto: UploadProductImageDto,
  ) {
    this.logger.debug(`Received upload image request for product ${productId}. File present: ${!!file}`);
    if (file) {
      this.logger.debug(`File details: ${file.originalname} (${file.mimetype}), size: ${file.size} bytes`);
    }

    return this.uploadProductImageUseCase.execute({
      productId,
      file,
      makePrimary: dto.makePrimary,
    });
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Delete('products/:id/images/:imageId')
  deleteProductImage(@Param('id') productId: string, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.deleteProductImageUseCase.execute(productId, imageId);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Patch('products/:id/images/reorder')
  reorderProductImages(@Param('id') productId: string, @Body() dto: ReorderProductImagesDto) {
    return this.reorderProductImagesUseCase.execute(productId, dto.imageIds);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Patch('products/:id/images/:imageId/primary')
  setPrimaryProductImage(@Param('id') productId: string, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.setPrimaryProductImageUseCase.execute(productId, imageId);
  }

  // ─── Home Banners ───────────────────────────────────────────────────

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('banners')
  getHomeBanners() {
    return this.getHomeBannersUseCase.execute();
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Post('banners')
  @UseInterceptors(FileInterceptor('file'))
  uploadHomeBanner(
    @UploadedFile() file: UploadFile | undefined,
    @Body('title') title: string,
    @Body('subtitle') subtitle?: string,
    @Body('ctaText') ctaText?: string,
    @Body('ctaLink') ctaLink?: string,
    @Body('secondaryText') secondaryText?: string,
    @Body('secondaryLink') secondaryLink?: string,
    @Body('altText') altText?: string,
    @Body('sortOrder') sortOrder?: number,
  ) {
    return this.uploadHomeBannerUseCase.execute({
      title,
      subtitle,
      ctaText,
      ctaLink,
      secondaryText,
      secondaryLink,
      altText,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      file,
    });
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Patch('banners/:id')
  updateHomeBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body('title') title?: string,
    @Body('subtitle') subtitle?: string,
    @Body('ctaText') ctaText?: string,
    @Body('ctaLink') ctaLink?: string,
    @Body('secondaryText') secondaryText?: string,
    @Body('secondaryLink') secondaryLink?: string,
    @Body('altText') altText?: string,
    @Body('sortOrder') sortOrder?: number,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.updateHomeBannerUseCase.execute(
      id,
      {
        title,
        subtitle,
        ctaText,
        ctaLink,
        secondaryText,
        secondaryLink,
        altText,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        isActive,
      },
    );
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Delete('banners/:id')
  deleteHomeBanner(@Param('id', ParseIntPipe) id: number) {
    return this.deleteHomeBannerUseCase.execute(id);
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Patch('banners/reorder')
  reorderHomeBanners(@Body('bannerIds') bannerIds: number[]) {
    return this.reorderHomeBannersUseCase.execute(bannerIds);
  }

  // ─── Categories ─────────────────────────────────────────────────────

  @Auth(PERMISSIONS.CATEGORIES_READ)
  @Get('categories')
  getCategories() {
    return this.getCategoriesUseCase.execute();
  }

  @Auth(PERMISSIONS.CATEGORIES_READ)
  @Get('categories/:id')
  getCategoryById(@Param('id') id: string) {
    return this.getCategoryByIdUseCase.execute(id);
  }

  @Auth(PERMISSIONS.CATEGORIES_CREATE)
  @Post('categories')
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.createCategoryUseCase.execute(dto);
  }

  @Auth(PERMISSIONS.CATEGORIES_UPDATE)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpsertCategoryDto) {
    return this.updateCategoryUseCase.execute(id, dto);
  }

  @Auth(PERMISSIONS.CATEGORIES_DELETE)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.deleteCategoryUseCase.execute(id);
  }

  // ─── Collections ────────────────────────────────────────────────────

  @Auth(PERMISSIONS.CATEGORIES_READ)
  @Get('collections')
  getCollections(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('gender') gender?: string,
  ) {
    return this.getCollectionsUseCase.execute({ page, limit, search, gender: gender as Gender });
  }

  @Auth(PERMISSIONS.CATEGORIES_READ)
  @Get('collections/:id')
  getCollectionById(@Param('id') id: string) {
    return this.getCollectionByIdUseCase.execute(id);
  }

  @Auth(PERMISSIONS.CATEGORIES_CREATE)
  @Post('collections')
  createCollection(@Body() dto: UpsertCollectionDto) {
    return this.createCollectionUseCase.execute(dto);
  }

  @Auth(PERMISSIONS.CATEGORIES_UPDATE)
  @Patch('collections/:id')
  updateCollection(@Param('id') id: string, @Body() dto: UpsertCollectionDto) {
    return this.updateCollectionUseCase.execute(id, dto);
  }

  @Auth(PERMISSIONS.CATEGORIES_DELETE)
  @Delete('collections/:id')
  deleteCollection(@Param('id') id: string) {
    return this.deleteCollectionUseCase.execute(id);
  }

  // ─── Countries ──────────────────────────────────────────────────────

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Get('countries')
  getCountries() {
    return this.getCountriesUseCase.execute();
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Post('countries')
  createCountry(@Body() dto: UpsertCountryDto) {
    return this.createCountryUseCase.execute(dto);
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() dto: UpsertCountryDto) {
    return this.updateCountryUseCase.execute(id, dto);
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.deleteCountryUseCase.execute(id);
  }

  // ─── Warehouses / Sucursales ──────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('warehouses')
  async getWarehouses(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    const safePage = Math.max(page ?? 1, 1);
    const safeLimit = Math.min(Math.max(limit ?? 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { inventories: true } },
        },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return {
      data: rows.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        location: w.location,
        isActive: w.isActive,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        inventoryCount: w._count.inventories,
      })),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  @Auth(PERMISSIONS.INVENTORY_READ)
  @Get('warehouses/:id')
  async getWarehouseById(@Param('id') id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: { select: { inventories: true } },
        inventories: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
                isActive: true,
                ProductImage: { take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      return null;
    }

    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      location: warehouse.location,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
      inventoryCount: warehouse._count.inventories,
      recentInventory: warehouse.inventories.map((i) => ({
        id: i.id,
        productId: i.productId,
        productTitle: i.product.title,
        productSku: i.product.sku,
        availableQuantity: i.availableQuantity,
        reservedQuantity: i.reservedQuantity,
        productImage: i.product.ProductImage[0]?.url,
      })),
    };
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Post('warehouses')
  async createWarehouse(
    @Body() dto: { name: string; code: string; location?: string },
  ) {
    // Check if code already exists
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new Error(`Warehouse with code '${dto.code}' already exists`);
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        location: dto.location,
        isActive: true,
      },
    });

    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      location: warehouse.location,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
    };
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Patch('warehouses/:id')
  async updateWarehouse(
    @Param('id') id: string,
    @Body() dto: { name?: string; code?: string; location?: string; isActive?: boolean },
  ) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check code uniqueness if changing
    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new Error(`Warehouse with code '${dto.code}' already exists`);
      }
    }

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });

    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      location: updated.location,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Delete('warehouses/:id')
  async deleteWarehouse(@Param('id') id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { _count: { select: { inventories: true } } },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    if (warehouse._count.inventories > 0) {
      throw new Error(`Cannot delete warehouse with ${warehouse._count.inventories} inventory items. Transfer or delete inventory first.`);
    }

    await this.prisma.warehouse.delete({ where: { id } });
    return { ok: true, message: 'Warehouse deleted successfully' };
  }

  // ─── Inventory Transfer ────────────────────────────────────────────

  @Auth(PERMISSIONS.INVENTORY_ADJUST)
  @Post('inventory/transfer')
  async transferInventory(
    @Body() dto: { productId: string; sourceWarehouseId: string; targetWarehouseId: string; quantity: number; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    // Validate warehouses exist
    const [source, target] = await Promise.all([
      this.prisma.warehouse.findUnique({ where: { id: dto.sourceWarehouseId } }),
      this.prisma.warehouse.findUnique({ where: { id: dto.targetWarehouseId } }),
    ]);

    if (!source) {
      throw new Error('Source warehouse not found');
    }
    if (!target) {
      throw new Error('Target warehouse not found');
    }
    if (dto.sourceWarehouseId === dto.targetWarehouseId) {
      throw new Error('Source and target warehouses must be different');
    }

    // Get or create source inventory
    const sourceInventory = await this.prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.sourceWarehouseId } },
    });

    if (!sourceInventory) {
      throw new Error('No inventory found at source warehouse for this product');
    }

    if (sourceInventory.availableQuantity < dto.quantity) {
      throw new Error(`Insufficient stock at source. Available: ${sourceInventory.availableQuantity}`);
    }

    // Execute transfer in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Decrease source
      const updatedSource = await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: { availableQuantity: { decrement: dto.quantity } },
      });

      // Get or create target inventory
      const targetInventory = await tx.inventory.upsert({
        where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.targetWarehouseId } },
        create: {
          productId: dto.productId,
          warehouseId: dto.targetWarehouseId,
          availableQuantity: dto.quantity,
          reservedQuantity: 0,
          lowStockThreshold: sourceInventory.lowStockThreshold,
          allowNegativeStock: sourceInventory.allowNegativeStock,
        },
        update: {
          availableQuantity: { increment: dto.quantity },
        },
      });

      // Create stock movement for audit
      await tx.stockMovement.create({
        data: {
          type: 'TRANSFER',
          quantity: dto.quantity,
          productId: dto.productId,
          warehouseId: dto.targetWarehouseId,
          sourceWarehouseId: dto.sourceWarehouseId,
          inventoryId: targetInventory.id,
          reference: `transfer:${source.code}->${target.code}`,
          note: dto.note || 'Transfer between warehouses',
          userId: user.sub,
        },
      });

      return { source: updatedSource, target: targetInventory };
    });

    return {
      ok: true,
      message: `Transferred ${dto.quantity} units from ${source.name} to ${target.name}`,
      sourceWarehouse: { id: source.id, name: source.name, code: source.code, availableQuantity: result.source.availableQuantity },
      targetWarehouse: { id: target.id, name: target.name, code: target.code, availableQuantity: result.target.availableQuantity },
    };
  }
}
