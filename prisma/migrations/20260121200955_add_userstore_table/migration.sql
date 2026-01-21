/*
  Warnings:

  - You are about to drop the column `userId` on the `stores` table. All the data in the column will be lost.
  - You are about to alter the column `phone1` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `phone2` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `number` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `city` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `postalCode` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `country` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `latitude` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `longitude` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `language` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `currency` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `timezone` on the `stores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.

*/
-- DropForeignKey
ALTER TABLE `stores` DROP FOREIGN KEY `stores_userId_fkey`;

-- DropIndex
DROP INDEX `stores_userId_idx` ON `stores`;

-- AlterTable
ALTER TABLE `stores` DROP COLUMN `userId`,
    MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `slug` VARCHAR(255) NOT NULL,
    MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `phone1` VARCHAR(50) NULL,
    MODIFY `phone2` VARCHAR(50) NULL,
    MODIFY `number` VARCHAR(20) NULL,
    MODIFY `street` VARCHAR(255) NULL,
    MODIFY `city` VARCHAR(100) NULL,
    MODIFY `postalCode` VARCHAR(20) NULL,
    MODIFY `country` VARCHAR(100) NULL,
    MODIFY `latitude` VARCHAR(50) NULL,
    MODIFY `longitude` VARCHAR(50) NULL,
    MODIFY `language` VARCHAR(10) NULL DEFAULT 'fr',
    MODIFY `currency` VARCHAR(10) NULL DEFAULT 'HTG',
    MODIFY `timezone` VARCHAR(50) NULL DEFAULT 'America/Port-au-Prince';

-- CreateTable
CREATE TABLE `user_stores` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `storeId` BIGINT NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'owner',
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified` DATETIME(3) NOT NULL,

    INDEX `user_stores_userId_idx`(`userId`),
    INDEX `user_stores_storeId_idx`(`storeId`),
    INDEX `user_stores_role_idx`(`role`),
    UNIQUE INDEX `user_stores_userId_storeId_key`(`userId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `storeId` BIGINT NOT NULL,
    `categoryId` BIGINT NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified` DATETIME(3) NOT NULL,

    INDEX `store_categories_storeId_idx`(`storeId`),
    INDEX `store_categories_categoryId_idx`(`categoryId`),
    INDEX `store_categories_isPrimary_idx`(`isPrimary`),
    INDEX `store_categories_order_idx`(`order`),
    UNIQUE INDEX `store_categories_storeId_categoryId_key`(`storeId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_phone_idx` ON `users`(`phone`);

-- CreateIndex
CREATE INDEX `users_username_idx` ON `users`(`username`);

-- AddForeignKey
ALTER TABLE `user_stores` ADD CONSTRAINT `user_stores_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_stores` ADD CONSTRAINT `user_stores_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_categories` ADD CONSTRAINT `store_categories_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_categories` ADD CONSTRAINT `store_categories_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
