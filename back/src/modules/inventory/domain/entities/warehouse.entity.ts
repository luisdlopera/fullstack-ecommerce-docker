export type WarehouseProps = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class WarehouseEntity {
  constructor(readonly props: WarehouseProps) {}
}
