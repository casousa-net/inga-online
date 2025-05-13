-- CreateTable
CREATE TABLE `historicoNivel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utenteId` INTEGER NOT NULL,
    `nivel` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `dataAlteracao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivoAlteracao` VARCHAR(191) NOT NULL,

    INDEX `historicoNivel_utenteId_idx`(`utenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `historicoNivel` ADD CONSTRAINT `historicoNivel_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
