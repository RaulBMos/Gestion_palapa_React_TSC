-- ============================================================
-- SOLUCIÓN TEMPORAL: Deshabilitar RLS para Desarrollo
-- ============================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- https://app.supabase.com/project/amnvnvsfoodmavlpcjbf/sql

-- IMPORTANTE: Esto es solo para desarrollo/pruebas
-- En producción deberías usar autenticación adecuada

-- Deshabilitar Row Level Security en todas las tablas
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_config DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó correctamente
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'reservations', 'transactions', 'system_config');

-- Deberías ver rowsecurity = false para todas las tablas
