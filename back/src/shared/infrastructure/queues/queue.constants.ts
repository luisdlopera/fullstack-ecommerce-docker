export const QUEUE_NAMES = {
  INVENTORY: 'inventory',
  PAYMENTS: 'payments',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const JOB_NAMES = {
  INVENTORY: {
    LOW_STOCK_ALERT: 'lowStockAlert',
  },
  PAYMENTS: {
    PAYMENT_CONFIRMED: 'paymentConfirmed',
  },
} as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 86_400,
    count: 100,
  },
  removeOnFail: {
    age: 86_400,
    count: 100,
  },
};

export const DEFAULT_CONCURRENCY = 5;
