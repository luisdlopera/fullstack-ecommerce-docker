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
import { FileInterceptor } from '@nestjs/platform-express';
import { OrderStatus, PaymentStatus, Role, Gender } from '@prisma/client';
import { Auth } from '../../../../shared/infrastructure/auth/auth.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { PERMISSIONS } from '../../../../shared/infrastructure/auth/permissions';
import { DeleteProductImageUseCase } from '../../application/use-cases/delete-product-image.use-case';
import { ReorderProductImagesUseCase } from '../../application/use-cases/reorder-product-images.use-case';
import { SetPrimaryProductImageUseCase } from '../../application/use-cases/set-primary-product-image.use-case';
import { UploadProductImageUseCase } from '../../application/use-cases/upload-product-image.use-case';
import { GetHomeBannersUseCase } from '../../application/use-cases/get-home-banners.use-case';
import { UploadHomeBannerUseCase } from '../../application/use-cases/upload-home-banner.use-case';
import { DeleteHomeBannerUseCase } from '../../application/use-cases/delete-home-banner.use-case';
import { UpdateHomeBannerUseCase } from '../../application/use-cases/update-home-banner.use-case';
import { ReorderHomeBannersUseCase } from '../../application/use-cases/reorder-home-banners.use-case';
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
    return this.updateHomeBannerUseCase.execute({
      id,
      title,
      subtitle,
      ctaText,
      ctaLink,
      secondaryText,
      secondaryLink,
      altText,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isActive,
    });
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Delete('banners/:id')
  deleteHomeBanner(@Param('id', ParseIntPipe) id: number) {
    return this.deleteHomeBannerUseCase.execute(id);
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Patch('banners/reorder')
  reorderHomeBanners(@Body('bannerIds') bannerIds: number[]) {
    return this.reorderHomeBannersUseCase.execute({ bannerIds });
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
}
