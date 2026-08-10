-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('SEEKER', 'EMPLOYER', 'ADMIN') NOT NULL DEFAULT 'SEEKER',
    `firstName` VARCHAR(80) NOT NULL,
    `lastName` VARCHAR(80) NOT NULL,
    `phone` VARCHAR(24) NULL,
    `avatarFileId` VARCHAR(30) NULL,
    `locale` VARCHAR(8) NOT NULL DEFAULT 'en',
    `lastLoginAt` DATETIME(3) NULL,
    `failedLogins` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_createdAt_idx`(`createdAt`),
    INDEX `User_avatarFileId_idx`(`avatarFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` CHAR(64) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `activeCompanyId` VARCHAR(30) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthToken` (
    `id` VARCHAR(30) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `type` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'EMAIL_CHANGE', 'COMPANY_INVITE') NOT NULL,
    `userId` VARCHAR(30) NULL,
    `email` VARCHAR(191) NULL,
    `companyId` VARCHAR(30) NULL,
    `payload` JSON NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AuthToken_tokenHash_key`(`tokenHash`),
    INDEX `AuthToken_userId_type_idx`(`userId`, `type`),
    INDEX `AuthToken_expiresAt_idx`(`expiresAt`),
    INDEX `AuthToken_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `tagline` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `website` VARCHAR(255) NULL,
    `size` ENUM('SIZE_1_10', 'SIZE_11_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_500_PLUS') NULL,
    `industryId` VARCHAR(30) NULL,
    `city` VARCHAR(80) NULL,
    `region` VARCHAR(60) NULL,
    `country` CHAR(2) NOT NULL DEFAULT 'ET',
    `tin` VARCHAR(20) NULL,
    `logoFileId` VARCHAR(30) NULL,
    `coverFileId` VARCHAR(30) NULL,
    `verification` ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    `verifiedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Company_slug_key`(`slug`),
    INDEX `Company_verification_idx`(`verification`),
    INDEX `Company_region_idx`(`region`),
    INDEX `Company_industryId_idx`(`industryId`),
    INDEX `Company_logoFileId_idx`(`logoFileId`),
    INDEX `Company_coverFileId_idx`(`coverFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyMember` (
    `id` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'RECRUITER') NOT NULL DEFAULT 'RECRUITER',
    `status` ENUM('INVITED', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `invitedById` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CompanyMember_userId_idx`(`userId`),
    UNIQUE INDEX `CompanyMember_companyId_userId_key`(`companyId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `nameAm` VARCHAR(120) NULL,
    `parentId` VARCHAR(30) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_parentId_sortOrder_idx`(`parentId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `createdById` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `description` TEXT NOT NULL,
    `summary` VARCHAR(320) NULL,
    `employmentType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'VOLUNTEER') NOT NULL,
    `workplaceType` ENUM('ONSITE', 'HYBRID', 'REMOTE') NOT NULL DEFAULT 'ONSITE',
    `experienceLevel` ENUM('INTERN', 'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE') NOT NULL,
    `categoryId` VARCHAR(30) NULL,
    `city` VARCHAR(80) NULL,
    `region` VARCHAR(60) NULL,
    `country` CHAR(2) NOT NULL DEFAULT 'ET',
    `isRemote` BOOLEAN NOT NULL DEFAULT false,
    `salaryMin` INTEGER NULL,
    `salaryMax` INTEGER NULL,
    `salaryCurrency` CHAR(3) NOT NULL DEFAULT 'ETB',
    `salaryPeriod` ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `salaryIsPublic` BOOLEAN NOT NULL DEFAULT true,
    `vacancies` INTEGER NOT NULL DEFAULT 1,
    `applyExternally` BOOLEAN NOT NULL DEFAULT false,
    `externalApplyUrl` VARCHAR(500) NULL,
    `applicationEmail` VARCHAR(191) NULL,
    `screeningQuestions` JSON NULL,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `rejectionReason` VARCHAR(500) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `featuredUntil` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `applicationCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Job_slug_key`(`slug`),
    INDEX `Job_status_publishedAt_idx`(`status`, `publishedAt` DESC),
    INDEX `Job_status_categoryId_publishedAt_idx`(`status`, `categoryId`, `publishedAt` DESC),
    INDEX `Job_status_region_publishedAt_idx`(`status`, `region`, `publishedAt` DESC),
    INDEX `Job_status_employmentType_publishedAt_idx`(`status`, `employmentType`, `publishedAt` DESC),
    INDEX `Job_status_isRemote_publishedAt_idx`(`status`, `isRemote`, `publishedAt` DESC),
    INDEX `Job_status_isFeatured_publishedAt_idx`(`status`, `isFeatured`, `publishedAt` DESC),
    INDEX `Job_companyId_status_createdAt_idx`(`companyId`, `status`, `createdAt` DESC),
    INDEX `Job_status_expiresAt_idx`(`status`, `expiresAt`),
    INDEX `Job_createdById_idx`(`createdById`),
    FULLTEXT INDEX `Job_title_description_idx`(`title`, `description`),
    FULLTEXT INDEX `Job_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(30) NOT NULL,
    `jobId` VARCHAR(30) NOT NULL,
    `seekerId` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `status` ENUM('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `coverLetter` TEXT NULL,
    `resumeFileId` VARCHAR(30) NULL,
    `answers` JSON NULL,
    `employerNote` TEXT NULL,
    `rating` TINYINT NULL,
    `viewedAt` DATETIME(3) NULL,
    `statusChangedAt` DATETIME(3) NULL,
    `withdrawnAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Application_companyId_status_createdAt_idx`(`companyId`, `status`, `createdAt` DESC),
    INDEX `Application_jobId_status_createdAt_idx`(`jobId`, `status`, `createdAt` DESC),
    INDEX `Application_seekerId_createdAt_idx`(`seekerId`, `createdAt` DESC),
    INDEX `Application_resumeFileId_idx`(`resumeFileId`),
    UNIQUE INDEX `Application_jobId_seekerId_key`(`jobId`, `seekerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationEvent` (
    `id` VARCHAR(30) NOT NULL,
    `applicationId` VARCHAR(30) NOT NULL,
    `actorUserId` VARCHAR(30) NULL,
    `fromStatus` ENUM('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN') NULL,
    `toStatus` ENUM('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN') NOT NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationEvent_applicationId_createdAt_idx`(`applicationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeekerProfile` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `headline` VARCHAR(160) NULL,
    `bio` TEXT NULL,
    `city` VARCHAR(80) NULL,
    `region` VARCHAR(60) NULL,
    `yearsExperience` INTEGER NULL,
    `experienceLevel` ENUM('INTERN', 'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE') NULL,
    `desiredSalaryMin` INTEGER NULL,
    `desiredSalaryCurrency` CHAR(3) NOT NULL DEFAULT 'ETB',
    `openToWork` BOOLEAN NOT NULL DEFAULT true,
    `openToRemote` BOOLEAN NOT NULL DEFAULT false,
    `isSearchable` BOOLEAN NOT NULL DEFAULT false,
    `linkedinUrl` VARCHAR(255) NULL,
    `githubUrl` VARCHAR(255) NULL,
    `portfolioUrl` VARCHAR(255) NULL,
    `primaryResumeId` VARCHAR(30) NULL,
    `completeness` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SeekerProfile_userId_key`(`userId`),
    INDEX `SeekerProfile_isSearchable_openToWork_idx`(`isSearchable`, `openToWork`),
    INDEX `SeekerProfile_region_idx`(`region`),
    INDEX `SeekerProfile_primaryResumeId_idx`(`primaryResumeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skill` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `Skill_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeekerSkill` (
    `profileId` VARCHAR(30) NOT NULL,
    `skillId` VARCHAR(30) NOT NULL,
    `years` INTEGER NULL,

    INDEX `SeekerSkill_skillId_idx`(`skillId`),
    PRIMARY KEY (`profileId`, `skillId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Education` (
    `id` VARCHAR(30) NOT NULL,
    `profileId` VARCHAR(30) NOT NULL,
    `institution` VARCHAR(160) NOT NULL,
    `degree` VARCHAR(120) NULL,
    `field` VARCHAR(120) NULL,
    `startYear` INTEGER NULL,
    `endYear` INTEGER NULL,

    INDEX `Education_profileId_idx`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkExperience` (
    `id` VARCHAR(30) NOT NULL,
    `profileId` VARCHAR(30) NOT NULL,
    `company` VARCHAR(160) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `summary` TEXT NULL,

    INDEX `WorkExperience_profileId_idx`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedJob` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `jobId` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedJob_jobId_idx`(`jobId`),
    UNIQUE INDEX `SavedJob_userId_jobId_key`(`userId`, `jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobAlert` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `email` VARCHAR(191) NOT NULL,
    `query` VARCHAR(200) NULL,
    `filters` JSON NULL,
    `frequency` VARCHAR(16) NOT NULL DEFAULT 'WEEKLY',
    `confirmedAt` DATETIME(3) NULL,
    `lastSentAt` DATETIME(3) NULL,
    `unsubscribeTokenHash` CHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `JobAlert_unsubscribeTokenHash_key`(`unsubscribeTokenHash`),
    INDEX `JobAlert_frequency_lastSentAt_idx`(`frequency`, `lastSentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileObject` (
    `id` VARCHAR(30) NOT NULL,
    `kind` ENUM('RESUME', 'COMPANY_LOGO', 'COMPANY_COVER', 'AVATAR') NOT NULL,
    `bucket` VARCHAR(63) NOT NULL,
    `objectKey` VARCHAR(400) NOT NULL,
    `mimeType` VARCHAR(120) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `checksum` VARCHAR(64) NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `scanStatus` ENUM('PENDING', 'CLEAN', 'INFECTED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `ownerUserId` VARCHAR(30) NULL,
    `companyId` VARCHAR(30) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FileObject_objectKey_key`(`objectKey`),
    INDEX `FileObject_ownerUserId_kind_idx`(`ownerUserId`, `kind`),
    INDEX `FileObject_confirmedAt_idx`(`confirmedAt`),
    INDEX `FileObject_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `kind` ENUM('FREE', 'ONE_OFF', 'BUNDLE', 'TERM') NOT NULL,
    `priceMinor` INTEGER NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'ETB',
    `jobPostCredits` INTEGER NOT NULL DEFAULT 0,
    `featuredCredits` INTEGER NOT NULL DEFAULT 0,
    `listingDays` INTEGER NOT NULL DEFAULT 30,
    `creditValidityDays` INTEGER NOT NULL DEFAULT 365,
    `maxActiveJobs` INTEGER NULL,
    `perks` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Plan_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wallet` (
    `companyId` VARCHAR(30) NOT NULL,
    `jobPostBalance` INTEGER NOT NULL DEFAULT 0,
    `featuredBalance` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`companyId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditLedger` (
    `id` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `kind` ENUM('JOB_POST', 'FEATURED') NOT NULL,
    `delta` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `reason` VARCHAR(80) NOT NULL,
    `orderId` VARCHAR(30) NULL,
    `jobId` VARCHAR(30) NULL,
    `actorUserId` VARCHAR(30) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CreditLedger_companyId_kind_createdAt_idx`(`companyId`, `kind`, `createdAt` DESC),
    INDEX `CreditLedger_orderId_idx`(`orderId`),
    INDEX `CreditLedger_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `planId` VARCHAR(30) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `renewalReminderSentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Subscription_companyId_status_idx`(`companyId`, `status`),
    INDEX `Subscription_status_endsAt_idx`(`status`, `endsAt`),
    INDEX `Subscription_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `planId` VARCHAR(30) NOT NULL,
    `createdById` VARCHAR(30) NOT NULL,
    `txRef` VARCHAR(64) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'ETB',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `provider` VARCHAR(24) NOT NULL DEFAULT 'chapa',
    `checkoutUrl` VARCHAR(600) NULL,
    `paidAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_txRef_key`(`txRef`),
    INDEX `Order_companyId_status_createdAt_idx`(`companyId`, `status`, `createdAt` DESC),
    INDEX `Order_status_expiresAt_idx`(`status`, `expiresAt`),
    INDEX `Order_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `provider` VARCHAR(24) NOT NULL,
    `providerRef` VARCHAR(120) NULL,
    `status` ENUM('INITIATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'INITIATED',
    `amountMinor` INTEGER NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'ETB',
    `method` VARCHAR(40) NULL,
    `failureReason` VARCHAR(255) NULL,
    `rawResponse` JSON NULL,
    `settledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_orderId_idx`(`orderId`),
    UNIQUE INDEX `Payment_provider_providerRef_key`(`provider`, `providerRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `companyId` VARCHAR(30) NOT NULL,
    `number` VARCHAR(32) NOT NULL,
    `subtotalMinor` INTEGER NOT NULL,
    `taxMinor` INTEGER NOT NULL DEFAULT 0,
    `totalMinor` INTEGER NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'ETB',
    `billToName` VARCHAR(160) NOT NULL,
    `billToTin` VARCHAR(20) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pdfFileId` VARCHAR(30) NULL,

    UNIQUE INDEX `Invoice_orderId_key`(`orderId`),
    UNIQUE INDEX `Invoice_number_key`(`number`),
    INDEX `Invoice_companyId_issuedAt_idx`(`companyId`, `issuedAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(30) NOT NULL,
    `provider` VARCHAR(24) NOT NULL,
    `eventKey` VARCHAR(160) NOT NULL,
    `signatureOk` BOOLEAN NOT NULL,
    `payload` JSON NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `error` VARCHAR(500) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookEvent_processedAt_idx`(`processedAt`),
    UNIQUE INDEX `WebhookEvent_provider_eventKey_key`(`provider`, `eventKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `actorUserId` VARCHAR(30) NULL,
    `companyId` VARCHAR(30) NULL,
    `action` VARCHAR(60) NOT NULL,
    `entityType` VARCHAR(40) NOT NULL,
    `entityId` VARCHAR(30) NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_companyId_createdAt_idx`(`companyId`, `createdAt` DESC),
    INDEX `AuditLog_actorUserId_createdAt_idx`(`actorUserId`, `createdAt` DESC),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobStatDaily` (
    `jobId` VARCHAR(30) NOT NULL,
    `day` DATE NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `applies` INTEGER NOT NULL DEFAULT 0,

    INDEX `JobStatDaily_day_idx`(`day`),
    PRIMARY KEY (`jobId`, `day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RateLimitBucket` (
    `key` VARCHAR(160) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `resetAt` DATETIME(3) NOT NULL,

    INDEX `RateLimitBucket_resetAt_idx`(`resetAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_avatarFileId_fkey` FOREIGN KEY (`avatarFileId`) REFERENCES `FileObject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthToken` ADD CONSTRAINT `AuthToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthToken` ADD CONSTRAINT `AuthToken_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_industryId_fkey` FOREIGN KEY (`industryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_logoFileId_fkey` FOREIGN KEY (`logoFileId`) REFERENCES `FileObject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_coverFileId_fkey` FOREIGN KEY (`coverFileId`) REFERENCES `FileObject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyMember` ADD CONSTRAINT `CompanyMember_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyMember` ADD CONSTRAINT `CompanyMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_seekerId_fkey` FOREIGN KEY (`seekerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_resumeFileId_fkey` FOREIGN KEY (`resumeFileId`) REFERENCES `FileObject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationEvent` ADD CONSTRAINT `ApplicationEvent_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeekerProfile` ADD CONSTRAINT `SeekerProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeekerProfile` ADD CONSTRAINT `SeekerProfile_primaryResumeId_fkey` FOREIGN KEY (`primaryResumeId`) REFERENCES `FileObject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeekerSkill` ADD CONSTRAINT `SeekerSkill_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `SeekerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeekerSkill` ADD CONSTRAINT `SeekerSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Education` ADD CONSTRAINT `Education_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `SeekerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkExperience` ADD CONSTRAINT `WorkExperience_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `SeekerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedJob` ADD CONSTRAINT `SavedJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedJob` ADD CONSTRAINT `SavedJob_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileObject` ADD CONSTRAINT `FileObject_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileObject` ADD CONSTRAINT `FileObject_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wallet` ADD CONSTRAINT `Wallet_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditLedger` ADD CONSTRAINT `CreditLedger_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditLedger` ADD CONSTRAINT `CreditLedger_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditLedger` ADD CONSTRAINT `CreditLedger_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
