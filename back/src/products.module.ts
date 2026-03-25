import { Module } from '@nestjs/common';
import { ProductsController } from './interfaces/http/products.controller';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { ProductsService } from './products/products.service';
import { CategoriesController } from './interfaces/http/categories.controller';
import { CountriesController } from './interfaces/http/countries.controller';

@Module({
  controllers: [ProductsController, CategoriesController, CountriesController],
  providers: [PrismaService, ProductsService],
  exports: [PrismaService, ProductsService]
})
export class ProductsModule {}
