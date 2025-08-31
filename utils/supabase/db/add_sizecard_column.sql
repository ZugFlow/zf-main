-- Aggiunge le colonne SizeCard e CardAlignment alla tabella team
-- Queste colonne controllano la dimensione e l'allineamento delle card degli appuntamenti nel calendario

-- Aggiungi colonna SizeCard
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS "SizeCard" TEXT DEFAULT 'normal';

-- Aggiungi colonna CardAlignment
ALTER TABLE team 
ADD COLUMN IF NOT EXISTS "CardAlignment" TEXT DEFAULT 'center';

-- Aggiorna i record esistenti con i valori di default
UPDATE team 
SET "SizeCard" = 'normal' 
WHERE "SizeCard" IS NULL;

UPDATE team 
SET "CardAlignment" = 'center' 
WHERE "CardAlignment" IS NULL;

-- Aggiungi commenti alle colonne per documentazione
COMMENT ON COLUMN team."SizeCard" IS 'Controlla la dimensione delle card degli appuntamenti: compact, normal, expanded';
COMMENT ON COLUMN team."CardAlignment" IS 'Controlla l''allineamento delle card degli appuntamenti: left, center, right'; 