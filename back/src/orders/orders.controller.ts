import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { JwtPayload } from '../common/auth/jwt-payload';
import { Roles } from '../common/auth/roles.decorator';
import { ADMIN_ROLES } from '../common/auth/permissions';
import { CreateOrderDto, UpdateOrderPaymentDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @Get()
  getMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return this.ordersService.getMyOrders(user.sub, page, limit);
  }

  @Get(':id')
  getOrderById(@Param('id') orderId: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getById(orderId, user.sub, user.role);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.ordersService.updateStatus(orderId, dto.status, user.sub, user.role);
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id/payment')
  markOrderAsPaid(@Param('id') orderId: string, @Body() dto: UpdateOrderPaymentDto) {
    return this.ordersService.markAsPaid(orderId, dto);
  }
}
