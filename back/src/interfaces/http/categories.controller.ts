import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator';
import { ProductsService } from '../../products/products.service';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getAll() {
    return this.productsService.getCategories();
  }
}
