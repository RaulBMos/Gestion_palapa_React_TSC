// Script de validación de Supabase
// Copia y pega este código en la consola del navegador (F12)

console.log('🔍 Iniciando diagnóstico de Supabase...\n');

// 1. Verificar configuración
const config = {
    url: import.meta.env.VITE_SUPABASE_URL,
    keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    enabled: import.meta.env.VITE_USE_SUPABASE === 'true'
};

console.log('📋 Configuración:');
console.log('  URL:', config.url);
console.log('  Key length:', config.keyLength, 'caracteres');
console.log('  Enabled:', config.enabled);

if (!config.enabled) {
    console.error('❌ Supabase está deshabilitado. Cambia VITE_USE_SUPABASE=true');
}

if (config.keyLength < 100) {
    console.error('❌ La clave parece incorrecta (muy corta)');
} else {
    console.log('✅ Clave parece válida');
}

// 2. Probar conexión
async function testConnection() {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(config.url, import.meta.env.VITE_SUPABASE_ANON_KEY);

        console.log('\n🔌 Probando conexión...');
        const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error de conexión:', error.message);
            if (error.message.includes('relation')) {
                console.log('💡 Las tablas no existen. Ejecuta supabase/schema.sql');
            }
        } else {
            console.log('✅ Conexión exitosa a Supabase');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testConnection();
