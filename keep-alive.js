/**
 * Keep-Alive para Supabase Free Tier
 * Realiza una pequeña consulta cada 6 días para mantener activo el proyecto
 */

// Configuración
const KEEP_ALIVE_INTERVAL = 6 * 24 * 60 * 60 * 1000; // 6 días en milisegundos
const TABLES_TO_PING = ['hero_content', 'about_content']; // Tablas a consultar

// Función principal
async function initKeepAlive() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase no está disponible. Reintentando en 1 hora...');
        setTimeout(initKeepAlive, 3600000); // Reintentar en 1 hora
        return;
    }

    try {
        // Realizar una pequeña consulta a cada tabla
        for (const table of TABLES_TO_PING) {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .limit(1);
            
            if (error) throw error;
            
            console.log(`Keep-Alive: Tabla ${table} ping exitoso`, new Date().toISOString());
        }
    } catch (error) {
        console.error('Error en Keep-Alive:', error);
    } finally {
        // Programar el próximo Keep-Alive
        setTimeout(initKeepAlive, KEEP_ALIVE_INTERVAL);
    }
}

// Iniciar después de que Supabase esté listo
document.addEventListener('supabaseReady', initKeepAlive);

// Iniciar también por timeout por si el evento no se dispara
setTimeout(() => {
    if (typeof supabase !== 'undefined' && !window.keepAliveInitialized) {
        initKeepAlive();
    }
}, 10000); // 10 segundos después de cargar la página