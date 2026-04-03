import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from './prisma-client-options';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  override get passwordResetToken() {
    return super.passwordResetToken;
  }

  constructor() {
    console.log('[PrismaService] Iniciando conexión...');
    super(createPrismaClientOptions());
    console.log('[PrismaService] Cliente creado');
  }

  async onModuleInit() {
    console.log('[PrismaService] Conectando a la base de datos...');
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DB connection timeout after 10s')), 10000)
        )
      ]);
      console.log('[PrismaService] Conexión exitosa');
    } catch (error) {
      console.error('[PrismaService] Error de conexión:', error);
      throw error;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
