import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { DEFAULT_CONCURRENCY, DEFAULT_JOB_OPTIONS, type QueueName } from './queue.constants';

export interface JobProcessor {
  queueName: QueueName;
  process(job: Job): Promise<unknown>;
}

function getRedisConnectionConfig() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }

  const url = new URL(redisUrl);
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port, 10) || 5003,
    password: url.password || undefined,
    username: url.username || undefined,
    db: url.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
    maxRetriesPerRequest: null as null,
  };
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly queueEvents = new Map<string, QueueEvents>();
  private readonly connectionConfig: ReturnType<typeof getRedisConnectionConfig>;

  constructor() {
    console.log('[QueueService] Inicializando...');
    this.connectionConfig = getRedisConnectionConfig();
    console.log('[QueueService] Configuración Redis cargada');
    // Las colas se crean lazy en getQueue para evitar bloqueos durante bootstrap
  }

  getQueue(name: QueueName): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      console.log(`[QueueService] Creando cola "${name}" (lazy)...`);
      queue = new Queue(name, {
        connection: this.connectionConfig,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      });
      this.queues.set(name, queue);
      this.logger.log(`Queue "${name}" initialized (lazy)`);
    }
    return queue;
  }

  registerProcessor(processor: JobProcessor): void {
    const { queueName } = processor;

    if (this.workers.has(queueName)) {
      this.logger.warn(`Worker for queue "${queueName}" already registered, skipping`);
      return;
    }

    const connection = getRedisConnectionConfig();

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        this.logger.log(`Processing job ${job.id} (${job.name}) in queue "${queueName}"`);
        return processor.process(job);
      },
      {
        connection,
        concurrency: DEFAULT_CONCURRENCY,
      },
    );

    worker.on('completed', (job: Job) => {
      this.logger.log(`Job ${job.id} (${job.name}) completed in queue "${queueName}"`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
      this.logger.error(`Job ${job?.id} (${job?.name}) failed in queue "${queueName}": ${err.message}`);
    });

    worker.on('error', (err: Error) => {
      this.logger.error(`Worker error for queue "${queueName}": ${err.message}`);
    });

    this.workers.set(queueName, worker);

    const events = new QueueEvents(queueName, { connection: getRedisConnectionConfig() });
    this.queueEvents.set(queueName, events);

    this.logger.log(`Worker registered for queue "${queueName}" (concurrency: ${DEFAULT_CONCURRENCY})`);
  }

  async addJob<T>(queueName: QueueName, jobName: string, data: T, opts?: Record<string, unknown>): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, opts);
    this.logger.log(`Job ${job.id} (${jobName}) added to queue "${queueName}"`);
    return job;
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down queues and workers...');

    const closePromises: Promise<void>[] = [];

    for (const [name, worker] of this.workers) {
      closePromises.push(worker.close().then(() => this.logger.log(`Worker "${name}" closed`)));
    }

    for (const [name, events] of this.queueEvents) {
      closePromises.push(events.close().then(() => this.logger.log(`QueueEvents "${name}" closed`)));
    }

    for (const [name, queue] of this.queues) {
      closePromises.push(queue.close().then(() => this.logger.log(`Queue "${name}" closed`)));
    }

    await Promise.all(closePromises);
    this.logger.log('All queues and workers shut down');
  }
}
