import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { ListCountriesUseCase } from '../../application/use-cases/list-countries.use-case';

@Public()
@Controller('countries')
export class CountriesController {
  constructor(@Inject(ListCountriesUseCase) private readonly listCountries: ListCountriesUseCase) {}

  @Get()
  getAll() {
    return this.listCountries.execute();
  }
}
