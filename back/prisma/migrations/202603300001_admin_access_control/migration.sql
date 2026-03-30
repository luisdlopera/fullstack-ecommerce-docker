-- Rename USER role to CUSTOMER and keep existing admin roles.
ALTER TYPE "Role" RENAME TO "Role_old";

CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'CUSTOMER');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role"
  USING (
    CASE
      WHEN "role"::text = 'USER' THEN 'CUSTOMER'
      ELSE "role"::text
    END
  )::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

DROP TYPE "Role_old";

-- Permission catalog and role-to-permission matrix.
CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
