-- CreateTable
CREATE TABLE `codigopautal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `taxa` DOUBLE NOT NULL DEFAULT 0,

    UNIQUE INDEX `CodigoPautal_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentosolicitacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitacaoId` INTEGER NOT NULL,
    `nomeArquivo` VARCHAR(191) NULL,
    `caminhoArquivo` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT '',
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nome` VARCHAR(191) NOT NULL DEFAULT '',
    `url` VARCHAR(191) NOT NULL DEFAULT '',

    INDEX `DocumentoSolicitacao_solicitacaoId_fkey`(`solicitacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moeda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `simbolo` VARCHAR(191) NOT NULL,
    `taxaCambio` DOUBLE NOT NULL,

    UNIQUE INDEX `Moeda_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitacaoautorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utenteId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `moedaId` INTEGER NOT NULL,
    `valorTotalKz` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pendente',
    `rupeReferencia` VARCHAR(191) NULL,
    `rupeDocumento` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `aprovadoPorDirecao` BOOLEAN NOT NULL DEFAULT false,
    `chefeId` INTEGER NULL,
    `dataAprovacao` DATETIME(3) NULL,
    `direcaoId` INTEGER NULL,
    `licencaDocumento` VARCHAR(191) NULL,
    `motivoRejeicao` VARCHAR(191) NULL,
    `observacoes` VARCHAR(191) NULL,
    `rupePago` BOOLEAN NOT NULL DEFAULT false,
    `rupeValidado` BOOLEAN NOT NULL DEFAULT false,
    `tecnicoId` INTEGER NULL,
    `validadoPorChefe` BOOLEAN NOT NULL DEFAULT false,
    `validadoPorTecnico` BOOLEAN NOT NULL DEFAULT false,
    `numeroFactura` VARCHAR(191) NULL,
    `chefeValidador` VARCHAR(191) NULL,
    `direcaoValidador` VARCHAR(191) NULL,
    `tecnicoValidador` VARCHAR(191) NULL,

    INDEX `SolicitacaoAutorizacao_moedaId_fkey`(`moedaId`),
    INDEX `SolicitacaoAutorizacao_utenteId_fkey`(`utenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitacaoitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitacaoId` INTEGER NOT NULL,
    `codigoPautalId` INTEGER NOT NULL,
    `quantidade` DOUBLE NOT NULL DEFAULT 0,
    `descricao` VARCHAR(191) NOT NULL DEFAULT '',
    `valorTotal` DOUBLE NOT NULL DEFAULT 0,
    `valorUnitario` DOUBLE NOT NULL DEFAULT 0,

    INDEX `SolicitacaoItem_codigoPautalId_fkey`(`codigoPautalId`),
    INDEX `SolicitacaoItem_solicitacaoId_fkey`(`solicitacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periodomonitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configuracaoId` INTEGER NOT NULL,
    `numeroPeriodo` INTEGER NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'FECHADO',
    `motivoReabertura` VARCHAR(191) NULL,
    `dataReaberturaSolicitada` DATETIME(3) NULL,
    `dataReaberturaAprovada` DATETIME(3) NULL,
    `dataValidadeReabertura` DATETIME(3) NULL,
    `rupeReferencia` VARCHAR(191) NULL,
    `rupePago` BOOLEAN NOT NULL DEFAULT false,
    `rupeValidado` BOOLEAN NOT NULL DEFAULT false,

    INDEX `periodomonitorizacao_configuracaoId_idx`(`configuracaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracaomonitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,
    `tipoPeriodo` VARCHAR(191) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `utenteId` INTEGER NULL,

    UNIQUE INDEX `configuracaomonitorizacao_utenteId_key`(`utenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodoId` INTEGER NOT NULL,
    `utenteId` INTEGER NOT NULL,
    `relatorioPath` VARCHAR(191) NULL,
    `parecerTecnicoPath` VARCHAR(191) NULL,
    `rupePath` VARCHAR(191) NULL,
    `rupeReferencia` VARCHAR(191) NULL,
    `rupePago` BOOLEAN NOT NULL DEFAULT false,
    `documentoFinalPath` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `estadoProcesso` VARCHAR(191) NOT NULL DEFAULT 'AGUARDANDO_PARECER',
    `dataPrevistaVisita` DATETIME(3) NULL,
    `dataVisita` DATETIME(3) NULL,
    `observacoesVisita` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tecnicomonitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monitorizacaoId` INTEGER NOT NULL,
    `tecnicoId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nif` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `role` ENUM('utente', 'direccao', 'chefe', 'tecnico', 'admin') NOT NULL DEFAULT 'utente',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `departamento` VARCHAR(191) NULL,

    UNIQUE INDEX `Utente_nif_key`(`nif`),
    UNIQUE INDEX `Utente_email_key`(`email`),
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
ALTER TABLE `documentosolicitacao` ADD CONSTRAINT `DocumentoSolicitacao_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacaoautorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacaoautorizacao` ADD CONSTRAINT `SolicitacaoAutorizacao_moedaId_fkey` FOREIGN KEY (`moedaId`) REFERENCES `moeda`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacaoautorizacao` ADD CONSTRAINT `SolicitacaoAutorizacao_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacaoitem` ADD CONSTRAINT `SolicitacaoItem_codigoPautalId_fkey` FOREIGN KEY (`codigoPautalId`) REFERENCES `codigopautal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacaoitem` ADD CONSTRAINT `SolicitacaoItem_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacaoautorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `periodomonitorizacao` ADD CONSTRAINT `periodomonitorizacao_configuracaoId_fkey` FOREIGN KEY (`configuracaoId`) REFERENCES `configuracaomonitorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configuracaomonitorizacao` ADD CONSTRAINT `configuracaomonitorizacao_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monitorizacao` ADD CONSTRAINT `monitorizacao_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `periodomonitorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monitorizacao` ADD CONSTRAINT `monitorizacao_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tecnicomonitorizacao` ADD CONSTRAINT `tecnicomonitorizacao_monitorizacaoId_fkey` FOREIGN KEY (`monitorizacaoId`) REFERENCES `monitorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tecnicomonitorizacao` ADD CONSTRAINT `tecnicomonitorizacao_tecnicoId_fkey` FOREIGN KEY (`tecnicoId`) REFERENCES `utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `codigopautalautorizacao` ADD CONSTRAINT `codigopautalautorizacao_autorizacaoId_fkey` FOREIGN KEY (`autorizacaoId`) REFERENCES `autorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autorizacao` ADD CONSTRAINT `autorizacao_solicitacaoId_fkey` FOREIGN KEY (`solicitacaoId`) REFERENCES `solicitacaoautorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
