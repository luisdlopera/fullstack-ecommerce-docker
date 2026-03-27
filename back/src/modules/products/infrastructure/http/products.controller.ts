import { Controller, Get, Inject, Param, ParseBoolPipe, ParseFloatPipe, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { GetFeaturedProductsUseCase } from '../../application/use-cases/get-featured-products.use-case';
import { GetProductBySlugUseCase } from '../../application/use-cases/get-product-by-slug.use-case';
import { GetProductStockBySlugUseCase } from '../../application/use-cases/get-product-stock-by-slug.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';

@Public()
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(GetFeaturedProductsUseCase)
    private readonly getFeaturedProducts: GetFeaturedProductsUseCase,
    @Inject(ListProductsUseCase)
    private readonly listProducts: ListProductsUseCase,
    @Inject(GetProductBySlugUseCase)
    private readonly getProductBySlug: GetProductBySlugUseCase,
    @Inject(GetProductStockBySlugUseCase)
    private readonly getProductStockBySlug: GetProductStockBySlugUseCase,
  ) {}

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 8);
    return this.getFeaturedProducts.execute(Number.isNaN(parsedLimit) ? 8 : parsedLimit);
  }

  @Get()
  list(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('mustTag') mustTag?: string,
    @Query('anyTags') anyTags?: string,
    @Query('gender') gender?: string,
    @Query('minPrice', new ParseFloatPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseFloatPipe({ optional: true })) maxPrice?: number,
    @Query('inStock', new ParseBoolPipe({ optional: true })) inStock?: boolean,
    @Query('sizes') sizes?: string,
    @Query('colors') colors?: string,
    @Query('categories') categories?: string,
    @Query('colSlugs') colSlugs?: string,
    @Query('classifications') classifications?: string,
    @Query('avail') avail?: string,
  ) {
    let inStockF = inStock;
    let outOfStockOnly = false;
    if (avail === 'out') {
      outOfStockOnly = true;
      inStockF = undefined;
    } else if (avail === 'in') {
      inStockF = true;
    }

    return this.listProducts.execute({
      page,
      limit,
      query,
      category,
      tag,
      mustTag,
      anyTags,
      gender,
      minPrice,
      maxPrice,
      inStock: inStockF,
      outOfStockOnly,
      sizes,
      colors,
      categories,
      colSlugs,
      classifications,
    });
  }

  @Get(':slug/stock')
  getStockBySlug(@Param('slug') slug: string) {
    return this.getProductStockBySlug.execute(slug);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.getProductBySlug.execute(slug);
  }
}
