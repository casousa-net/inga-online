/*
  Warnings:

  - You are about to alter the column `role` on the `utente` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `utente` MODIFY `role` ENUM('utente', 'direccao', 'chefe', 'tecnico') NOT NULL DEFAULT 'utente';
