import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PRODUCT_REPOSITORY } from './domain/ports/product-repository.port';
import { GetFeaturedProductsUseCase } from './application/use-cases/get-featured-products.use-case';
import { GetProductBySlugUseCase } from './application/use-cases/get-product-by-slug.use-case';
import { GetProductStockBySlugUseCase } from './application/use-cases/get-product-stock-by-slug.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { ListCountriesUseCase } from './application/use-cases/list-countries.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { CategoriesController } from './infrastructure/http/categories.controller';
import { CountriesController } from './infrastructure/http/countries.controller';
import { ProductsController } from './infrastructure/http/products.controller';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';

@Module({
  imports: [SharedModule],
  controllers: [ProductsController, CategoriesController, CountriesController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    GetFeaturedProductsUseCase,
    ListProductsUseCase,
    GetProductBySlugUseCase,
    GetProductStockBySlugUseCase,
    ListCategoriesUseCase,
    ListCountriesUseCase,
  ],
})
export class ProductsModule {}
