// Cargamos primero la biblioteca de Supabase
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
document.head.appendChild(supabaseScript);

// Esperamos a que cargue la biblioteca
supabaseScript.onload = function() {
    // Configuración de Supabase
    const SUPABASE_URL = 'https://wqmseuqbjcbhciqdncpw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbXNldXFiamNiaGNpcWRuY3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTg2MTgsImV4cCI6MjA2ODQzNDYxOH0.ODENiCE0z9tpMVwOMVfNv-Fu3bE1MEt9CwMgsTi1G_M';
    
    // Creamos el cliente Supabase
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Disparamos evento cuando Supabase está listo
    const event = new Event('supabaseReady');
    document.dispatchEvent(event);
};