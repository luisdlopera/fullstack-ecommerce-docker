import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  type CountryRecord,
  type ProductRepositoryPort,
} from '../../domain/ports/product-repository.port';

@Injectable()
export class ListCountriesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  execute(): Promise<CountryRecord[]> {
    return this.productRepository.findAllCountries();
  }
}
