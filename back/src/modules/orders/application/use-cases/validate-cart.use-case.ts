import { Inject, Injectable } from '@nestjs/common';
import { ORDERS_REPOSITORY, type OrdersRepositoryPort } from '../../domain/ports/orders-repository.port';

@Injectable()
export class ValidateCartUseCase {
  constructor(@Inject(ORDERS_REPOSITORY) private readonly ordersRepository: OrdersRepositoryPort) {}

  execute(items: { productId: string; size: string; quantity: number }[]) {
    return this.ordersRepository.validateCartStock(items);
  }
}
