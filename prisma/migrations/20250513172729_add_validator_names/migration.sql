-- AlterTable
ALTER TABLE `solicitacaoautorizacao` ADD COLUMN `chefeValidador` VARCHAR(191) NULL,
    ADD COLUMN `direcaoValidador` VARCHAR(191) NULL,
    ADD COLUMN `tecnicoValidador` VARCHAR(191) NULL;
