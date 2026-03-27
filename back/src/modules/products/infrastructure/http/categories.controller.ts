import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(@Inject(ListCategoriesUseCase) private readonly listCategories: ListCategoriesUseCase) {}

  @Get()
  getAll() {
    return this.listCategories.execute();
  }
}
