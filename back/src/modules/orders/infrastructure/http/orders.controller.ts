import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { Roles } from '../../../../shared/infrastructure/auth/roles.decorator';
import { ADMIN_ROLES } from '../../../../shared/infrastructure/auth/permissions';
import { CreateOrderDto, UpdateOrderPaymentDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { ValidateCartUseCase } from '../../application/use-cases/validate-cart.use-case';
import { GetMyOrdersUseCase } from '../../application/use-cases/get-my-orders.use-case';
import { GetOrderByIdUseCase } from '../../application/use-cases/get-order-by-id.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { MarkOrderPaidUseCase } from '../../application/use-cases/mark-order-paid.use-case';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(CreateOrderUseCase) private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject(ValidateCartUseCase) private readonly validateCartUseCase: ValidateCartUseCase,
    @Inject(GetMyOrdersUseCase) private readonly getMyOrdersUseCase: GetMyOrdersUseCase,
    @Inject(GetOrderByIdUseCase) private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    @Inject(UpdateOrderStatusUseCase) private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    @Inject(MarkOrderPaidUseCase) private readonly markOrderPaidUseCase: MarkOrderPaidUseCase,
  ) {}

  @Public()
  @Post()
  createOrder(@CurrentUser() user: JwtPayload | undefined, @Body() dto: CreateOrderDto) {
    if (!user && !dto.guestEmail) {
      throw new BadRequestException('Guest email is required if not logged in');
    }
    return this.createOrderUseCase.execute(user?.sub, dto);
  }

  @Post('validate-cart')
  validateCart(@Body() body: { items: { productId: string; size: string; quantity: number }[] }) {
    if (!body.items || !Array.isArray(body.items)) {
      return { valid: false, errors: [{ message: 'Items array is required' }] };
    }
    return this.validateCartUseCase.execute(body.items);
  }

  @Get()
  getMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.getMyOrdersUseCase.execute(user.sub, page, limit);
  }

  @Get(':id')
  getOrderById(@Param('id') orderId: string, @CurrentUser() user: JwtPayload) {
    return this.getOrderByIdUseCase.execute(orderId, user.sub, user.role);
  }

  @Patch(':id/status')
  updateOrderStatus(@Param('id') orderId: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: JwtPayload) {
    return this.updateOrderStatusUseCase.execute(orderId, dto.status, user.sub, user.role);
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id/payment')
  markOrderAsPaid(@Param('id') orderId: string, @Body() dto: UpdateOrderPaymentDto) {
    return this.markOrderPaidUseCase.execute(orderId, dto);
  }
}
