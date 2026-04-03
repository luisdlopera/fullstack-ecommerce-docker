# Redis & BullMQ

## Overview

Nexstore uses **Redis** with **BullMQ** for asynchronous job processing and future caching capabilities.

## Services

### Redis

**Purpose**: In-memory data store for:
- BullMQ job queues
- Future: Session cache, query results cache

**Configuration**:
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: nexstore_redis
    restart: unless-stopped
    ports:
      - '5003:6379'
    volumes:
      - redis_data:/var/lib/redis/data
```

**Connection URL**:
```env
REDIS_URL=redis://localhost:5003
# or in Docker:
REDIS_URL=redis://redis:6379
```

### BullMQ

**Purpose**: Queue management for background jobs

**Queues**:
- `low-stock-alerts`: Inventory notifications
- `payment-confirmation`: Async payment processing

## Queue Architecture

```
┌──────────┐     Add Job      ┌──────────┐     Process     ┌──────────┐
│  NestJS  │────────────────▶│   Redis  │───────────────▶│ Processor│
│  Service │                 │  Queue   │                │  Worker  │
└──────────┘                 └──────────┘                └──────────┘
     │                            │                           │
     │                            │                           │
     ▼                            ▼                           ▼
  Business                     Job Data                   Job Result
  Logic                        { payload,               (success/error)
                               options }
```

## Queue Configuration

### Queue Module

```typescript
// shared/infrastructure/queues/queue.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue(
      { name: 'low-stock-alerts' },
      { name: 'payment-confirmation' },
    ),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
```

### Queue Service

```typescript
// shared/infrastructure/queues/queue.service.ts
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('low-stock-alerts') private lowStockQueue: Queue,
    @InjectQueue('payment-confirmation') private paymentQueue: Queue,
  ) {}

  async addLowStockAlert(data: LowStockAlertData) {
    return this.lowStockQueue.add('check-low-stock', data, {
      delay: 5000,  // 5 second debounce
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000,  // 1 minute
      },
    });
  }

  async addPaymentConfirmation(data: PaymentConfirmationData) {
    return this.paymentQueue.add('process-payment', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 30000,  // 30 seconds
      },
    });
  }
}
```

## Queue: Low Stock Alerts

### Purpose

Send notifications when inventory falls below threshold.

### Job Data

```typescript
interface LowStockAlertData {
  productId: string;
  warehouseId: string;
  currentStock: number;
  threshold: number;
  timestamp: Date;
}
```

### Processor

```typescript
// modules/inventory/infrastructure/queue/low-stock.processor.ts
@Processor('low-stock-alerts')
export class LowStockProcessor {
  private readonly logger = new Logger(LowStockProcessor.name);

  @Process('check-low-stock')
  async handleAlert(job: Job<LowStockAlertData>) {
    const { productId, warehouseId, currentStock, threshold } = job.data;

    this.logger.warn(
      `Low stock alert: Product ${productId} at ${warehouseId}: ${currentStock} (threshold: ${threshold})`
    );

    // Send notification
    await this.notificationService.sendLowStockAlert({
      productId,
      warehouseId,
      currentStock,
      threshold,
    });

    // Could also: send email, Slack message, etc.
  }
}
```

### Notifier

```typescript
// modules/inventory/infrastructure/queue/low-stock-queue.notifier.ts
@Injectable()
export class LowStockQueueNotifier {
  constructor(
    @InjectQueue('low-stock-alerts') private queue: Queue,
  ) {}

  async notify(data: LowStockAlertData): Promise<void> {
    // Debounce: add delay to batch rapid changes
    await this.queue.add('check-low-stock', data, {
      delay: 5000,
      jobId: `low-stock-${data.productId}-${data.warehouseId}`,  // Deduplication
    });
  }
}
```

## Queue: Payment Confirmation

### Purpose

Process MercadoPago payment webhooks asynchronously.

### Job Data

```typescript
interface PaymentConfirmationData {
  paymentId: string;
  orderId: string;
  status: string;
  receivedAt: Date;
}
```

### Processor

```typescript
// modules/payments/infrastructure/queue/payment-confirmation.processor.ts
@Processor('payment-confirmation')
export class PaymentConfirmationProcessor {
  private readonly logger = new Logger(PaymentConfirmationProcessor.name);

  @Process('process-payment')
  async handlePayment(job: Job<PaymentConfirmationData>) {
    const { paymentId, orderId, status } = job.data;

    this.logger.log(`Processing payment ${paymentId} for order ${orderId}`);

    try {
      // Fetch payment details from MercadoPago
      const payment = await this.mercadoPago.getPayment(paymentId);

      if (payment.status === 'approved') {
        await this.confirmPayment(orderId, paymentId);
      } else if (payment.status === 'rejected') {
        await this.handleFailedPayment(orderId, payment);
      }
    } catch (error) {
      this.logger.error(
        `Payment processing failed: ${error.message}`,
        error.stack,
      );
      throw error;  // Trigger retry
    }
  }

  private async confirmPayment(orderId: string, paymentId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
          isPaid: true,
          paidAt: new Date(),
          transactionId: paymentId,
        },
      });

      // Commit inventory
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      for (const item of order.items) {
        await this.inventoryService.commitStock(
          item.productId,
          item.warehouseId,
          item.quantity,
          orderId,
        );
      }
    });
  }
}
```

## Monitoring

### Queue Dashboard

BullMQ includes a dashboard (via bull-board or similar):

```typescript
// Optional: Add bull-board for monitoring
import { createBullBoard } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullMQAdapter(lowStockQueue),
    new BullMQAdapter(paymentQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

### Queue Health

```typescript
// Health check endpoint
@Controller('health')
export class HealthController {
  @Get('queues')
  async checkQueues() {
    const lowStockCount = await this.lowStockQueue.getJobCounts();
    const paymentCount = await this.paymentQueue.getJobCounts();

    return {
      lowStockAlerts: lowStockCount,
      paymentConfirmation: paymentCount,
    };
  }
}
```

## Retry Configuration

| Queue | Attempts | Backoff Strategy | Max Delay |
|-------|----------|------------------|-----------|
| low-stock-alerts | 3 | Exponential | 4 minutes |
| payment-confirmation | 5 | Exponential | 8 minutes |

## Job Options

```typescript
// Common job options
const options: JobsOptions = {
  attempts: 3,              // Retry attempts
  backoff: {
    type: 'exponential',    // or 'fixed'
    delay: 60000,           // Initial delay (ms)
  },
  delay: 5000,              // Delay before first attempt
  priority: 1,              // Job priority (1-10)
  removeOnComplete: 100,    // Keep last 100 completed jobs
  removeOnFail: 50,         // Keep last 50 failed jobs
};
```

## Future Enhancements

- **Scheduled jobs**: Daily reports, nightly cleanup
- **Rate limiting**: Prevent queue flooding
- **Dead letter queue**: Handle permanently failed jobs
- **Queue metrics**: Prometheus/Grafana integration

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Inventory Module](../../backend/modules/inventory.md)
- [Payments Module](../../backend/modules/payments.md)
