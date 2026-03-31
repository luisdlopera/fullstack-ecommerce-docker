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
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import { Auth } from '../../../../shared/infrastructure/auth/auth.decorator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { PERMISSIONS } from '../../../../shared/infrastructure/auth/permissions';
import { AdminService } from '../../application/admin.service';
import { DeleteProductImageUseCase } from '../../application/use-cases/delete-product-image.use-case';
import { ReorderProductImagesUseCase } from '../../application/use-cases/reorder-product-images.use-case';
import { SetPrimaryProductImageUseCase } from '../../application/use-cases/set-primary-product-image.use-case';
import { UploadProductImageUseCase } from '../../application/use-cases/upload-product-image.use-case';
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
import type { UploadFile } from '../../application/use-cases/upload-file.type';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(UploadProductImageUseCase)
    private readonly uploadProductImageUseCase: UploadProductImageUseCase,
    @Inject(DeleteProductImageUseCase)
    private readonly deleteProductImageUseCase: DeleteProductImageUseCase,
    @Inject(ReorderProductImagesUseCase)
    private readonly reorderProductImagesUseCase: ReorderProductImagesUseCase,
    @Inject(SetPrimaryProductImageUseCase)
    private readonly setPrimaryProductImageUseCase: SetPrimaryProductImageUseCase,
  ) {}

  // ─── Dashboard ──────────────────────────────────────────────────────

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/summary')
  getDashboardSummary(@Query('period') period?: string) {
    return this.adminService.getDashboardSummary(period);
  }

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/sales-chart')
  getSalesChart(@Query('period') period?: string) {
    return this.adminService.getSalesChart(period);
  }

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/recent-orders')
  getRecentOrders(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.adminService.getRecentOrders(limit);
  }

  @Auth(PERMISSIONS.DASHBOARD_READ)
  @Get('dashboard/top-products')
  getTopProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.adminService.getTopProducts(limit);
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
    return this.adminService.getUsers(page, limit, search, role, isActive, user.role);
  }

  @Auth(PERMISSIONS.USERS_READ)
  @Get('users/:id')
  getUserById(@Param('id') userId: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.getUserById(userId, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Post('users')
  createUser(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.createUser(dto, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id')
  updateUser(@Param('id') userId: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.updateUser(userId, dto, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.updateUserRole(userId, dto, user.sub, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id/status')
  updateUserStatus(@Param('id') userId: string, @Body() dto: UpdateUserStatusDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.updateUserStatus(userId, dto.isActive, user.sub, user.role);
  }

  @Auth(PERMISSIONS.USERS_MANAGE)
  @Delete('users/:id')
  deleteUser(@Param('id') userId: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deleteUser(userId, user.sub, user.role);
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
    return this.adminService.getOrders(page, limit, search, status, paymentStatus, paid);
  }

  @Auth(PERMISSIONS.ORDERS_READ)
  @Get('orders/:id')
  getOrderById(@Param('id') orderId: string) {
    return this.adminService.getOrderById(orderId);
  }

  @Auth(PERMISSIONS.ORDERS_UPDATE)
  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') orderId: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.updateOrderStatus(orderId, dto.status, user.sub);
  }

  @Auth(PERMISSIONS.PAYMENTS_READ)
  @Patch('orders/:id/payment-status')
  updatePaymentStatus(@Param('id') orderId: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.adminService.updatePaymentStatus(orderId, dto.paymentStatus);
  }

  @Auth(PERMISSIONS.ORDERS_UPDATE)
  @Patch('orders/:id/notes')
  updateOrderNotes(@Param('id') orderId: string, @Body() dto: UpdateOrderNotesDto) {
    return this.adminService.updateOrderNotes(orderId, dto.internalNotes);
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
    return this.adminService.getProducts(page, limit, search, categoryId, isActive, inStock);
  }

  @Auth(PERMISSIONS.PRODUCTS_READ)
  @Get('products/:id')
  getProductById(@Param('id') productId: string) {
    return this.adminService.getProductById(productId);
  }

  @Auth(PERMISSIONS.PRODUCTS_CREATE)
  @Post('products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Patch('products/:id')
  updateProduct(@Param('id') productId: string, @Body() dto: UpsertProductDto) {
    return this.adminService.updateProduct(productId, dto);
  }

  @Auth(PERMISSIONS.PRODUCTS_DELETE)
  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deleteProduct(productId, user.sub);
  }

  @Auth(PERMISSIONS.PRODUCTS_UPDATE)
  @Patch('products/:id/status')
  updateProductStatus(@Param('id') productId: string, @Body('isActive', ParseBoolPipe) isActive: boolean) {
    return this.adminService.updateProductStatus(productId, isActive);
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

  // ─── Categories ─────────────────────────────────────────────────────

  @Auth(PERMISSIONS.CATEGORIES_READ)
  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Auth(PERMISSIONS.CATEGORIES_READ)
  @Get('categories/:id')
  getCategoryById(@Param('id') id: string) {
    return this.adminService.getCategoryById(id);
  }

  @Auth(PERMISSIONS.CATEGORIES_CREATE)
  @Post('categories')
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Auth(PERMISSIONS.CATEGORIES_UPDATE)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpsertCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Auth(PERMISSIONS.CATEGORIES_DELETE)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ─── Countries ──────────────────────────────────────────────────────

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Get('countries')
  getCountries() {
    return this.adminService.getCountries();
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Post('countries')
  createCountry(@Body() dto: UpsertCountryDto) {
    return this.adminService.createCountry(dto);
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() dto: UpsertCountryDto) {
    return this.adminService.updateCountry(id, dto);
  }

  @Auth(PERMISSIONS.SETTINGS_MANAGE)
  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.adminService.deleteCountry(id);
  }
}
