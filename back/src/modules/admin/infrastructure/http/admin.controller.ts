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
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { Roles } from '../../../../shared/infrastructure/auth/roles.decorator';
import {
  ADMIN_ROLES,
  FULL_ACCESS_ROLES,
  MANAGEMENT_ROLES,
} from '../../../../shared/infrastructure/auth/permissions';
import { AdminService } from '../../application/admin.service';
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

class ProductImageDto {
  @IsString()
  @MinLength(3)
  imageUrl!: string;
}

@Roles(...ADMIN_ROLES)
@Controller('admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  // ─── Dashboard ──────────────────────────────────────────────────────

  @Get('dashboard/summary')
  getDashboardSummary(@Query('period') period?: string) {
    return this.adminService.getDashboardSummary(period);
  }

  @Get('dashboard/sales-chart')
  getSalesChart(@Query('period') period?: string) {
    return this.adminService.getSalesChart(period);
  }

  @Get('dashboard/recent-orders')
  getRecentOrders(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.adminService.getRecentOrders(limit);
  }

  @Get('dashboard/top-products')
  getTopProducts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.adminService.getTopProducts(limit);
  }

  // ─── Users ──────────────────────────────────────────────────────────

  @Get('users')
  getUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    return this.adminService.getUsers(page, limit, search, role, isActive);
  }

  @Get('users/:id')
  getUserById(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Patch('users/:id')
  updateUser(@Param('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(userId, dto);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.updateUserRole(userId, dto, user.sub);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Patch('users/:id/status')
  updateUserStatus(@Param('id') userId: string, @Body() dto: UpdateUserStatusDto, @CurrentUser() user: JwtPayload) {
    return this.adminService.updateUserStatus(userId, dto.isActive, user.sub);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Delete('users/:id')
  deleteUser(@Param('id') userId: string, @CurrentUser() user: JwtPayload) {
    return this.adminService.deleteUser(userId, user.sub);
  }

  // ─── Orders ─────────────────────────────────────────────────────────

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

  @Get('orders/:id')
  getOrderById(@Param('id') orderId: string) {
    return this.adminService.getOrderById(orderId);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(orderId, dto.status);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Patch('orders/:id/payment-status')
  updatePaymentStatus(@Param('id') orderId: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.adminService.updatePaymentStatus(orderId, dto.paymentStatus);
  }

  @Patch('orders/:id/notes')
  updateOrderNotes(@Param('id') orderId: string, @Body() dto: UpdateOrderNotesDto) {
    return this.adminService.updateOrderNotes(orderId, dto.internalNotes);
  }

  // ─── Products ───────────────────────────────────────────────────────

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

  @Get('products/:id')
  getProductById(@Param('id') productId: string) {
    return this.adminService.getProductById(productId);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Post('products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Patch('products/:id')
  updateProduct(@Param('id') productId: string, @Body() dto: UpsertProductDto) {
    return this.adminService.updateProduct(productId, dto);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Patch('products/:id/status')
  updateProductStatus(@Param('id') productId: string, @Body('isActive', ParseBoolPipe) isActive: boolean) {
    return this.adminService.updateProductStatus(productId, isActive);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Post('products/:id/images')
  addProductImage(@Param('id') productId: string, @Body() dto: ProductImageDto) {
    return this.adminService.addProductImage(productId, dto.imageUrl);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Delete('products/:id/images/:imageId')
  deleteProductImage(@Param('id') productId: string, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.adminService.deleteProductImage(productId, imageId);
  }

  // ─── Categories ─────────────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Get('categories/:id')
  getCategoryById(@Param('id') id: string) {
    return this.adminService.getCategoryById(id);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Post('categories')
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Roles(...MANAGEMENT_ROLES)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpsertCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ─── Countries ──────────────────────────────────────────────────────

  @Get('countries')
  getCountries() {
    return this.adminService.getCountries();
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Post('countries')
  createCountry(@Body() dto: UpsertCountryDto) {
    return this.adminService.createCountry(dto);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body() dto: UpsertCountryDto) {
    return this.adminService.updateCountry(id, dto);
  }

  @Roles(...FULL_ACCESS_ROLES)
  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.adminService.deleteCountry(id);
  }
}
