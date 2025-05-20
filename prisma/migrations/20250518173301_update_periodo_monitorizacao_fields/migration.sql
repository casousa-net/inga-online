/*
  Warnings:

  - You are about to drop the column `dataReaberturaSolicitada` on the `periodomonitorizacao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `periodomonitorizacao` DROP COLUMN `dataReaberturaSolicitada`,
    ADD COLUMN `dataSolicitacaoReabertura` DATETIME(3) NULL,
    ADD COLUMN `rupeNumero` VARCHAR(191) NULL,
    ADD COLUMN `statusReabertura` VARCHAR(191) NULL;
