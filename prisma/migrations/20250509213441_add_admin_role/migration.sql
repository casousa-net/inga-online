-- AlterTable
ALTER TABLE `utente` MODIFY `role` ENUM('utente', 'direccao', 'chefe', 'tecnico', 'admin') NOT NULL DEFAULT 'utente';
