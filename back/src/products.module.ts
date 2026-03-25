import { Module } from '@nestjs/common';
import { ProductsController } from './interfaces/http/products.controller';
import { GetFeaturedProductsUseCase } from './application/use-cases/get-featured-products.use-case';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PrismaProductRepository } from './infrastructure/repositories/prisma-product.repository';
import { PRODUCT_REPOSITORY } from './application/ports/product-repository.port';

@Module({
  controllers: [ProductsController],
  providers: [
    PrismaService,
    GetFeaturedProductsUseCase,
    PrismaProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: PrismaProductRepository
    }
  ]
})
export class ProductsModule {}
