-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "sku" TEXT,
    "gtin" TEXT,
    "brand" TEXT,
    "countryOfOrigin" TEXT,
    "materials" TEXT,
    "materialSource" TEXT,
    "careInstructions" TEXT,
    "isRepairable" TEXT,
    "sparePartsAvailable" TEXT,
    "lifespan" TEXT,
    "conformityDeclaration" TEXT,
    "disposalInfo" TEXT,
    "takebackOffered" TEXT,
    "takebackContact" TEXT,
    "secondLifeInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dpps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpp_media" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpp_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpp_versions" (
    "id" TEXT NOT NULL,
    "dppId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "gtin" TEXT,
    "brand" TEXT,
    "countryOfOrigin" TEXT,
    "materials" TEXT,
    "materialSource" TEXT,
    "careInstructions" TEXT,
    "isRepairable" TEXT,
    "sparePartsAvailable" TEXT,
    "lifespan" TEXT,
    "conformityDeclaration" TEXT,
    "disposalInfo" TEXT,
    "takebackOffered" TEXT,
    "takebackContact" TEXT,
    "secondLifeInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,
    "publicUrl" TEXT,
    "qrCodeImageUrl" TEXT,

    CONSTRAINT "dpp_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_organizationId_key" ON "memberships"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "dpp_versions_dppId_version_key" ON "dpp_versions"("dppId", "version");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpps" ADD CONSTRAINT "dpps_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpp_media" ADD CONSTRAINT "dpp_media_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpp_versions" ADD CONSTRAINT "dpp_versions_dppId_fkey" FOREIGN KEY ("dppId") REFERENCES "dpps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpp_versions" ADD CONSTRAINT "dpp_versions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
