-- Add nome_cliente column to pedidos table
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nome_cliente TEXT NULL;
