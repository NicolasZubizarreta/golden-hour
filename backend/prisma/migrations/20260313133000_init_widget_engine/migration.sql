-- DropForeignKey
ALTER TABLE `Widget` DROP FOREIGN KEY `Widget_groupId_fkey`;

-- DropIndex
DROP INDEX `Widget_groupId_type_key` ON `Widget`;

-- AlterTable
ALTER TABLE `Widget` ADD COLUMN `data` JSON NULL,
    ADD COLUMN `position` INTEGER NOT NULL,
    ADD COLUMN `size` ENUM('SQUARE', 'RECT') NOT NULL DEFAULT 'SQUARE',
    MODIFY `type` ENUM('TEST', 'NOTES', 'MAP', 'SPOTIFY', 'BUDGET', 'COUNTDOWN') NOT NULL DEFAULT 'TEST';

-- CreateIndex
CREATE INDEX `Widget_groupId_position_idx` ON `Widget`(`groupId`, `position`);

-- AddForeignKey
ALTER TABLE `Widget` ADD CONSTRAINT `Widget_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
