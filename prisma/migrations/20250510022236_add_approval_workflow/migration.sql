-- AlterTable
ALTER TABLE `solicitacaoautorizacao` ADD COLUMN `aprovadoPorDirecao` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `chefeId` INTEGER NULL,
    ADD COLUMN `dataAprovacao` DATETIME(3) NULL,
    ADD COLUMN `direcaoId` INTEGER NULL,
    ADD COLUMN `licencaDocumento` VARCHAR(191) NULL,
    ADD COLUMN `motivoRejeicao` VARCHAR(191) NULL,
    ADD COLUMN `observacoes` VARCHAR(191) NULL,
    ADD COLUMN `rupePago` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `rupeValidado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tecnicoId` INTEGER NULL,
    ADD COLUMN `validadoPorChefe` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `validadoPorTecnico` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'Pendente';
