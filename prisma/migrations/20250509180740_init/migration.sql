-- CreateTable
CREATE TABLE `CodigoPautal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CodigoPautal_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Moeda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `simbolo` VARCHAR(191) NOT NULL,
    `taxaCambio` DOUBLE NOT NULL,

    UNIQUE INDEX `Moeda_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SolicitacaoAutorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utenteId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `moedaId` INTEGER NOT NULL,
    `valorTotalKz` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `rupeReferencia` VARCHAR(191) NULL,
    `rupeDocumento` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SolicitacaoItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitacaoId` INTEGER NOT NULL,
    `codigoPautalId` INTEGER NOT NULL,
    `precoUnitario` DOUBLE NOT NULL,
    `precoUnitarioKz` DOUBLE NOT NULL,
    `quantidade` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentoSolicitacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitacaoId` INTEGER NOT NULL,
    `nomeArquivo` VARCHAR(191) NOT NULL,
    `caminhoArquivo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SolicitacaoAutorizacao` ADD CONSTRAINT `SolicitacaoAutorizacao_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `Utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitacaoAutorizacao` ADD CONSTRAINT `SolicitacaoAutorizacao_moedaId_fkey` FOREIGN KEY (`moedaId`) REFERENCES `Moeda`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitacaoItem` ADD CONSTRAINT `SolicitacaoItem_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `SolicitacaoAutorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SolicitacaoItem` ADD CONSTRAINT `SolicitacaoItem_codigoPautalId_fkey` FOREIGN KEY (`codigoPautalId`) REFERENCES `CodigoPautal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoSolicitacao` ADD CONSTRAINT `DocumentoSolicitacao_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `SolicitacaoAutorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
