import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UsersController } from './infrastructure/http/users.controller';
import { UsersService } from './application/users.service';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
