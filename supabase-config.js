// Versión mejorada de supabase-config.js
document.addEventListener('DOMContentLoaded', function() {
    if (window.supabase) return; // Evitar duplicados
    
    const supabaseScript = document.createElement('script');
    supabaseScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
    supabaseScript.onerror = function() {
        console.error('Error al cargar Supabase');
        // Reintentar después de 2 segundos
        setTimeout(() => document.head.appendChild(supabaseScript), 2000);
    };
    
    supabaseScript.onload = function() {
        try {
            const SUPABASE_URL = 'https://wqmseuqbjcbhciqdncpw.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbXNldXFiamNiaGNpcWRuY3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTg2MTgsImV4cCI6MjA2ODQzNDYxOH0.ODENiCE0z9tpMVwOMVfNv-Fu3bE1MEt9CwMgsTi1G_M';
            
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            // Disparar evento cuando Supabase está listo
            const event = new Event('supabaseReady');
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error al inicializar Supabase:', error);
        }
    };
    
    document.head.appendChild(supabaseScript);
});
