/*
  Warnings:

  - You are about to drop the column `precoUnitario` on the `solicitacaoitem` table. All the data in the column will be lost.
  - You are about to drop the column `precoUnitarioKz` on the `solicitacaoitem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `codigopautal` ADD COLUMN `taxa` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `documentosolicitacao` ADD COLUMN `nome` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `url` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `nomeArquivo` VARCHAR(191) NULL,
    MODIFY `caminhoArquivo` VARCHAR(191) NULL,
    MODIFY `tipo` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `solicitacaoitem` DROP COLUMN `precoUnitario`,
    DROP COLUMN `precoUnitarioKz`,
    ADD COLUMN `descricao` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `valorTotal` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `valorUnitario` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `quantidade` DOUBLE NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `solicitacaoautorizacao` ADD CONSTRAINT `solicitacaoautorizacao_tecnicoId_fkey` FOREIGN KEY (`tecnicoId`) REFERENCES `utente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacaoautorizacao` ADD CONSTRAINT `solicitacaoautorizacao_chefeId_fkey` FOREIGN KEY (`chefeId`) REFERENCES `utente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
