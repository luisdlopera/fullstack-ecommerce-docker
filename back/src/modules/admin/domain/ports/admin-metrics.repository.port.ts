export const ADMIN_METRICS_REPOSITORY = Symbol('ADMIN_METRICS_REPOSITORY');

export type DashboardMetricsSnapshot = {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  activeProducts: number;
  pendingOrders: number;
  outOfStock: number;
  periodRevenue: number;
  periodOrders: number;
};

export type PaidOrderPoint = { total: number; createdAt: Date };

export type TopProductPoint = { product: unknown | null; totalSold: number };

export interface AdminMetricsRepositoryPort {
  getDashboardSnapshot(dateFrom: Date): Promise<DashboardMetricsSnapshot>;
  listPaidOrdersSince(dateFrom: Date): Promise<PaidOrderPoint[]>;
  listRecentOrders(limit: number): Promise<unknown[]>;
  listTopProducts(limit: number): Promise<TopProductPoint[]>;
}
