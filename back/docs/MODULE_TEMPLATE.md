# Plantilla de módulo (hexagonal por feature)

## Estructura mínima recomendada

```
src/modules/example/
  example.module.ts
  domain/
    repositories/
      example.repository.port.ts
  application/
    use-cases/
      do-something.use-case.ts
  infrastructure/
    http/
      example.controller.ts
    persistence/
      prisma-example.repository.ts
    example.service.ts          # opcional: fachada hasta extraer use cases
```

## example.module.ts

```typescript
import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ExampleController } from './infrastructure/http/example.controller';
import { ExampleService } from './infrastructure/example.service';

@Module({
  imports: [SharedModule],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
```

## Port (domain o application)

```typescript
// domain/repositories/example.repository.port.ts
export const EXAMPLE_REPOSITORY = Symbol('EXAMPLE_REPOSITORY');

export interface ExampleRepositoryPort {
  findById(id: string): Promise<{ id: string } | null>;
}
```

## Use case

```typescript
// application/use-cases/do-something.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { EXAMPLE_REPOSITORY, ExampleRepositoryPort } from '../../domain/repositories/example.repository.port';

@Injectable()
export class DoSomethingUseCase {
  constructor(
    @Inject(EXAMPLE_REPOSITORY)
    private readonly repo: ExampleRepositoryPort,
  ) {}

  async execute(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new Error('not found');
    return row;
  }
}
```

## Adapter Prisma

```typescript
// infrastructure/persistence/prisma-example.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ExampleRepositoryPort } from '../../domain/repositories/example.repository.port';

@Injectable()
export class PrismaExampleRepository implements ExampleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.someModel.findUnique({ where: { id } });
  }
}
```

## Controller

```typescript
// infrastructure/http/example.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { DoSomethingUseCase } from '../../application/use-cases/do-something.use-case';

@Controller('examples')
export class ExampleController {
  constructor(private readonly doSomething: DoSomethingUseCase) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.doSomething.execute(id);
  }
}
```

Registrar en el module:

```typescript
providers: [
  DoSomethingUseCase,
  { provide: EXAMPLE_REPOSITORY, useClass: PrismaExampleRepository },
],
```
