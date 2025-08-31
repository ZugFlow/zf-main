-- Aggiunge le colonne SizeCard e CardAlignment alla tabella hoursettings per personalizzazione per utente
-- Queste colonne permettono a ogni membro del team di personalizzare la visualizzazione delle card appuntamenti

-- Aggiungi colonna SizeCard
ALTER TABLE hoursettings 
ADD COLUMN IF NOT EXISTS "SizeCard" TEXT DEFAULT 'normal';

-- Aggiorna i record esistenti con il valore di default
UPDATE hoursettings 
SET "SizeCard" = 'normal'
WHERE "SizeCard" IS NULL;

-- Aggiungi commento alla colonna
COMMENT ON COLUMN hoursettings."SizeCard" IS 'Controlla la dimensione delle card degli appuntamenti: compact, normal, expanded';

-- Aggiungi colonna CardAlignment
ALTER TABLE hoursettings 
ADD COLUMN IF NOT EXISTS "CardAlignment" TEXT DEFAULT 'center';

-- Aggiorna i record esistenti con il valore di default
UPDATE hoursettings 
SET "CardAlignment" = 'center'
WHERE "CardAlignment" IS NULL;

-- Aggiungi commento alla colonna
COMMENT ON COLUMN hoursettings."CardAlignment" IS 'Controlla l''allineamento delle card degli appuntamenti: left, center, right'; 