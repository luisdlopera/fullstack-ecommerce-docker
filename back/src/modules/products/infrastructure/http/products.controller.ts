import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { GetFeaturedProductsUseCase } from '../../application/use-cases/get-featured-products.use-case';
import { GetProductBySlugUseCase } from '../../application/use-cases/get-product-by-slug.use-case';
import { GetProductFacetsUseCase } from '../../application/use-cases/get-product-facets.use-case';
import { GetProductStockBySlugUseCase } from '../../application/use-cases/get-product-stock-by-slug.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { toProductListFilters } from './product-list-query.util';

@Public()
@Controller('products')
export class ProductsController {
  constructor(
    @Inject(GetFeaturedProductsUseCase)
    private readonly getFeaturedProducts: GetFeaturedProductsUseCase,
    @Inject(ListProductsUseCase)
    private readonly listProducts: ListProductsUseCase,
    @Inject(GetProductFacetsUseCase)
    private readonly getProductFacets: GetProductFacetsUseCase,
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

  @Get('facets')
  facets(
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
    return this.getProductFacets.execute(
      toProductListFilters({
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
        inStock,
        sizes,
        colors,
        categories,
        colSlugs,
        classifications,
        avail,
      }),
    );
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
    return this.listProducts.execute(
      toProductListFilters({
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
        inStock,
        sizes,
        colors,
        categories,
        colSlugs,
        classifications,
        avail,
      }),
    );
  }

  @Get(':slug/stock')
  getStockBySlug(@Param('slug') slug: string) {
    return this.getProductStockBySlug.execute(slug);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const product = await this.getProductBySlug.execute(slug);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
