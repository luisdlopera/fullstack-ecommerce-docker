import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { JwtPayload } from '../common/auth/jwt-payload';
import { Roles } from '../common/auth/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';

class ProductImageDto {
  @IsString()
  @MinLength(3)
  imageUrl!: string;
}

@Roles(Role.admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('email') email?: string,
    @Query('role') role?: 'admin' | 'user'
  ) {
    return this.adminService.getUsers(page, limit, email, role);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.adminService.updateUserRole(userId, dto, user.sub);
  }

  @Get('orders')
  getOrders(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('paid', new ParseBoolPipe({ optional: true })) paid?: boolean
  ) {
    return this.adminService.getOrders(page, limit, paid);
  }

  @Post('products')
  createProduct(@Body() dto: UpsertProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') productId: string, @Body() dto: UpsertProductDto) {
    return this.adminService.updateProduct(productId, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  @Post('products/:id/images')
  addProductImage(@Param('id') productId: string, @Body() dto: ProductImageDto) {
    return this.adminService.addProductImage(productId, dto.imageUrl);
  }

  @Delete('products/:id/images/:imageId')
  deleteProductImage(
    @Param('id') productId: string,
    @Param('imageId', ParseIntPipe) imageId: number
  ) {
    return this.adminService.deleteProductImage(productId, imageId);
  }
}
