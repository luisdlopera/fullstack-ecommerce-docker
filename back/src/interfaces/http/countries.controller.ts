import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator';
import { ProductsService } from '../../products/products.service';

@Public()
@Controller('countries')
export class CountriesController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  getAll() {
    return this.productsService.getCountries();
  }
}
