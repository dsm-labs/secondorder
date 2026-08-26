-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ANALYST', 'IT_ADMIN', 'SECURITY_MANAGER', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "BusinessCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VulnerabilitySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VulnerabilityStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'ACCEPTED_RISK');

-- CreateEnum
CREATE TYPE "DataSensitivity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BusinessImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OrganizationalRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'ACCEPTED_RISK');

-- CreateEnum
CREATE TYPE "RemediationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_VALIDATION', 'RESOLVED', 'ACCEPTED_RISK');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'DEPARTMENT', 'ASSET', 'VULNERABILITY', 'RISK_RECORD', 'REMEDIATION_TASK');

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "departmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "operatingSystem" TEXT,
    "departmentId" UUID NOT NULL,
    "ownerId" UUID,
    "businessCriticality" "BusinessCriticality" NOT NULL,
    "internetExposure" BOOLEAN NOT NULL,
    "status" "AssetStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cvssScore" DECIMAL(3,1) NOT NULL,
    "severity" "VulnerabilitySeverity" NOT NULL,
    "affectedAssetId" UUID NOT NULL,
    "detectionDate" TIMESTAMP(3) NOT NULL,
    "status" "VulnerabilityStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRecord" (
    "id" UUID NOT NULL,
    "vulnerabilityId" UUID NOT NULL,
    "dataSensitivity" "DataSensitivity" NOT NULL,
    "businessImpact" "BusinessImpact" NOT NULL,
    "organizationalRiskScore" DECIMAL(5,2) NOT NULL,
    "organizationalRiskLevel" "OrganizationalRiskLevel" NOT NULL,
    "explanation" TEXT,
    "status" "RiskStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationTask" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedUserId" UUID NOT NULL,
    "relatedVulnerabilityId" UUID NOT NULL,
    "relatedAssetId" UUID NOT NULL,
    "priority" "RemediationPriority" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "RemediationStatus" NOT NULL,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "Asset_departmentId_idx" ON "Asset"("departmentId");

-- CreateIndex
CREATE INDEX "Asset_ownerId_idx" ON "Asset"("ownerId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Vulnerability_affectedAssetId_idx" ON "Vulnerability"("affectedAssetId");

-- CreateIndex
CREATE INDEX "Vulnerability_severity_idx" ON "Vulnerability"("severity");

-- CreateIndex
CREATE INDEX "Vulnerability_status_idx" ON "Vulnerability"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Vulnerability_identifier_affectedAssetId_key" ON "Vulnerability"("identifier", "affectedAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskRecord_vulnerabilityId_key" ON "RiskRecord"("vulnerabilityId");

-- CreateIndex
CREATE INDEX "RiskRecord_organizationalRiskLevel_idx" ON "RiskRecord"("organizationalRiskLevel");

-- CreateIndex
CREATE INDEX "RiskRecord_status_idx" ON "RiskRecord"("status");

-- CreateIndex
CREATE INDEX "RemediationTask_assignedUserId_idx" ON "RemediationTask"("assignedUserId");

-- CreateIndex
CREATE INDEX "RemediationTask_relatedVulnerabilityId_idx" ON "RemediationTask"("relatedVulnerabilityId");

-- CreateIndex
CREATE INDEX "RemediationTask_relatedAssetId_idx" ON "RemediationTask"("relatedAssetId");

-- CreateIndex
CREATE INDEX "RemediationTask_status_idx" ON "RemediationTask"("status");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_affectedAssetId_fkey" FOREIGN KEY ("affectedAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRecord" ADD CONSTRAINT "RiskRecord_vulnerabilityId_fkey" FOREIGN KEY ("vulnerabilityId") REFERENCES "Vulnerability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationTask" ADD CONSTRAINT "RemediationTask_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationTask" ADD CONSTRAINT "RemediationTask_relatedVulnerabilityId_fkey" FOREIGN KEY ("relatedVulnerabilityId") REFERENCES "Vulnerability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationTask" ADD CONSTRAINT "RemediationTask_relatedAssetId_fkey" FOREIGN KEY ("relatedAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
