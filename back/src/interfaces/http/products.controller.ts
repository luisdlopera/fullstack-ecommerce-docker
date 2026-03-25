import { Controller, Get, Query } from '@nestjs/common';
import { GetFeaturedProductsUseCase } from '../../application/use-cases/get-featured-products.use-case';

@Controller('products')
export class ProductsController {
  constructor(private readonly getFeaturedProductsUseCase: GetFeaturedProductsUseCase) {}

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 8);
    return this.getFeaturedProductsUseCase.execute(Number.isNaN(parsedLimit) ? 8 : parsedLimit);
  }
}
