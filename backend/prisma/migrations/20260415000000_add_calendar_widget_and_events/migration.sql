-- AlterTable: add CALENDAR to WidgetType enum
ALTER TABLE `Widget` MODIFY COLUMN `type` ENUM('TEST', 'NOTES', 'MAP', 'MUSIC', 'BUDGET', 'COUNTDOWN', 'TODO', 'CALENDAR') NOT NULL DEFAULT 'TEST';

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `widgetId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Event_widgetId_idx`(`widgetId`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_widgetId_fkey` FOREIGN KEY (`widgetId`) REFERENCES `Widget`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
