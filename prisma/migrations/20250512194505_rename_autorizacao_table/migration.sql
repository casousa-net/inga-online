/*
  Warnings:

  - You are about to drop the `autorizacaoambiental` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `autorizacaoambiental` DROP FOREIGN KEY `autorizacaoambiental_solicitacaoId_fkey`;

-- DropForeignKey
ALTER TABLE `codigopautalautorizacao` DROP FOREIGN KEY `codigopautalautorizacao_autorizacaoId_fkey`;

-- DropTable
DROP TABLE `autorizacaoambiental`;

-- CreateTable
CREATE TABLE `autorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroAutorizacao` VARCHAR(191) NOT NULL,
    `tipoAutorizacao` VARCHAR(191) NOT NULL,
    `solicitacaoId` INTEGER NOT NULL,
    `dataEmissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `numeroFactura` VARCHAR(191) NOT NULL,
    `produtos` VARCHAR(191) NOT NULL,
    `quantidade` VARCHAR(191) NOT NULL,
    `revogado` BOOLEAN NOT NULL DEFAULT false,
    `dataRevogacao` DATETIME(3) NULL,
    `motivoRevogacao` VARCHAR(191) NULL,
    `assinadoPor` VARCHAR(191) NOT NULL DEFAULT 'SIMONE DA SILVA',

    UNIQUE INDEX `autorizacao_numeroAutorizacao_key`(`numeroAutorizacao`),
    UNIQUE INDEX `autorizacao_solicitacaoId_key`(`solicitacaoId`),
    INDEX `autorizacao_solicitacaoId_idx`(`solicitacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `autorizacao` ADD CONSTRAINT `autorizacao_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacaoautorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `codigopautalautorizacao` ADD CONSTRAINT `codigopautalautorizacao_autorizacaoId_fkey` FOREIGN KEY (`autorizacaoId`) REFERENCES `autorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
