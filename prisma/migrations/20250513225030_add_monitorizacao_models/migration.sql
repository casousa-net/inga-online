-- CreateTable
CREATE TABLE `ConfiguracaoMonitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utenteId` INTEGER NOT NULL,
    `tipoPeriodo` ENUM('ANUAL', 'SEMESTRAL', 'TRIMESTRAL') NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConfiguracaoMonitorizacao_utenteId_key`(`utenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeriodoMonitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configuracaoId` INTEGER NOT NULL,
    `numeroPeriodo` INTEGER NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NOT NULL,
    `estado` ENUM('ABERTO', 'FECHADO', 'AGUARDANDO_REAVALIACAO', 'REABERTURA_SOLICITADA') NOT NULL DEFAULT 'ABERTO',

    INDEX `PeriodoMonitorizacao_configuracaoId_idx`(`configuracaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Monitorizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utenteId` INTEGER NOT NULL,
    `periodoId` INTEGER NULL,
    `numeroProcesso` VARCHAR(191) NOT NULL,
    `dataSubmissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Pendente',
    `relatorioPath` VARCHAR(191) NULL,
    `parecerTecnicoPath` VARCHAR(191) NULL,
    `rupeReferencia` VARCHAR(191) NULL,
    `rupeDocumentoPath` VARCHAR(191) NULL,
    `rupePago` BOOLEAN NOT NULL DEFAULT false,
    `rupeValidado` BOOLEAN NOT NULL DEFAULT false,
    `observacoes` VARCHAR(191) NULL,
    `tecnicoId` INTEGER NULL,
    `chefeId` INTEGER NULL,
    `direcaoId` INTEGER NULL,

    UNIQUE INDEX `Monitorizacao_numeroProcesso_key`(`numeroProcesso`),
    INDEX `Monitorizacao_utenteId_idx`(`utenteId`),
    INDEX `Monitorizacao_periodoId_idx`(`periodoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConfiguracaoMonitorizacao` ADD CONSTRAINT `ConfiguracaoMonitorizacao_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeriodoMonitorizacao` ADD CONSTRAINT `PeriodoMonitorizacao_configuracaoId_fkey` FOREIGN KEY (`configuracaoId`) REFERENCES `ConfiguracaoMonitorizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Monitorizacao` ADD CONSTRAINT `Monitorizacao_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Monitorizacao` ADD CONSTRAINT `Monitorizacao_periodoId_fkey` FOREIGN KEY (`periodoId`) REFERENCES `PeriodoMonitorizacao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
