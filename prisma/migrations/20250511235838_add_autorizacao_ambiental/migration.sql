-- DropForeignKey
ALTER TABLE `solicitacaoautorizacao` DROP FOREIGN KEY `solicitacaoautorizacao_chefeId_fkey`;

-- DropForeignKey
ALTER TABLE `solicitacaoautorizacao` DROP FOREIGN KEY `solicitacaoautorizacao_tecnicoId_fkey`;

-- DropIndex
DROP INDEX `solicitacaoautorizacao_chefeId_fkey` ON `solicitacaoautorizacao`;

-- DropIndex
DROP INDEX `solicitacaoautorizacao_tecnicoId_fkey` ON `solicitacaoautorizacao`;

-- CreateTable
CREATE TABLE `autorizacaoambiental` (
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

    UNIQUE INDEX `autorizacaoambiental_numeroAutorizacao_key`(`numeroAutorizacao`),
    UNIQUE INDEX `autorizacaoambiental_solicitacaoId_key`(`solicitacaoId`),
    INDEX `autorizacaoambiental_solicitacaoId_idx`(`solicitacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codigopautalautorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `autorizacaoId` INTEGER NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,

    INDEX `codigopautalautorizacao_autorizacaoId_idx`(`autorizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `autorizacaoambiental` ADD CONSTRAINT `autorizacaoambiental_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacaoautorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `codigopautalautorizacao` ADD CONSTRAINT `codigopautalautorizacao_autorizacaoId_fkey` FOREIGN KEY (`autorizacaoId`) REFERENCES `autorizacaoambiental`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
