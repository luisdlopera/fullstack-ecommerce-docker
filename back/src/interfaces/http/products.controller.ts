import { Controller, Get, Param, ParseBoolPipe, ParseFloatPipe, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from '../../products/products.service';
import { Public } from '../../common/auth/public.decorator';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 8);
    return this.productsService.getFeatured(Number.isNaN(parsedLimit) ? 8 : parsedLimit);
  }

  @Get()
  list(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('gender') gender?: string,
    @Query('minPrice', new ParseFloatPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseFloatPipe({ optional: true })) maxPrice?: number,
    @Query('inStock', new ParseBoolPipe({ optional: true })) inStock?: boolean
  ) {
    return this.productsService.list({
      page,
      limit,
      query,
      category,
      gender,
      minPrice,
      maxPrice,
      inStock
    });
  }

  @Get(':slug/stock')
  getStockBySlug(@Param('slug') slug: string) {
    return this.productsService.getStockBySlug(slug);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }
}
