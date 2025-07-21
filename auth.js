/**
 * Sistema de Autenticación para MagVet - Versión Mejorada
 * 
 * Cambios principales:
 * 1. Mejor manejo de errores
 * 2. Verificación robusta de Supabase
 * 3. Compatibilidad con GitHub Pages
 * 4. Prevención de carga duplicada
 * 5. Mensajes de depuración útiles
 */

// Estado global de autenticación
window.authState = {
    initialized: false,
    supabaseReady: false,
    retryCount: 0,
    maxRetries: 5
};

// 1. Función principal de inicialización
function initializeAuthSystem() {
    console.log('[Auth] Inicializando sistema de autenticación...');
    
    // Verificar si ya está inicializado
    if (window.authState.initialized) {
        console.log('[Auth] El sistema ya estaba inicializado');
        return;
    }

    // Configurar reintentos
    const checkSupabase = () => {
        window.authState.retryCount++;
        
        if (typeof supabase !== 'undefined' && supabase.auth) {
            console.log('[Auth] Supabase está listo');
            window.authState.supabaseReady = true;
            setupAuth();
        } else if (window.authState.retryCount <= window.authState.maxRetries) {
            console.log(`[Auth] Supabase no listo (intento ${window.authState.retryCount}/${window.authState.maxRetries})`);
            setTimeout(checkSupabase, 1000 * window.authState.retryCount);
        } else {
            showFatalError('No se pudo cargar el sistema de autenticación. Recarga la página.');
        }
    };

    // Iniciar verificación
    checkSupabase();

    // Timeout de seguridad
    setTimeout(() => {
        if (!window.authState.supabaseReady) {
            showFatalError('Tiempo de espera agotado al cargar Supabase.');
        }
    }, 15000);
}

// 2. Mostrar errores fatales
function showFatalError(message) {
    console.error('[Auth Error]', message);
    
    // Crear elemento de error si no existe
    let errorElement = document.getElementById('auth-fatal-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'auth-fatal-error';
        errorElement.style.position = 'fixed';
        errorElement.style.top = '0';
        errorElement.style.left = '0';
        errorElement.style.right = '0';
        errorElement.style.backgroundColor = '#ff4444';
        errorElement.style.color = 'white';
        errorElement.style.padding = '15px';
        errorElement.style.zIndex = '9999';
        errorElement.style.textAlign = 'center';
        document.body.prepend(errorElement);
    }
    
    errorElement.innerHTML = `
        ${message} 
        <button onclick="window.location.reload()" style="margin-left: 10px; padding: 5px 10px; cursor: pointer;">
            Recargar
        </button>
    `;
}

// 3. Configurar sistema de autenticación
function setupAuth() {
    if (window.authState.initialized) return;
    
    console.log('[Auth] Configurando módulo de autenticación...');
    
    // Verificar sesión
    checkSession();
    
    // Configurar eventos
    setupAuthEvents();
    
    // Marcar como inicializado
    window.authState.initialized = true;
    console.log('[Auth] Sistema de autenticación listo');
}

// 4. Verificación de sesión
async function checkSession() {
    try {
        console.log('[Auth] Verificando sesión...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const currentPage = window.location.pathname.split('/').pop();
        
        // Redirecciones basadas en sesión
        if (session) {
            console.log('[Auth] Sesión activa encontrada');
            if (currentPage === 'login.html' || currentPage === 'register.html') {
                window.location.href = 'dashboard.html';
            }
        } else {
            console.log('[Auth] No hay sesión activa');
            if (currentPage === 'dashboard.html') {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('[Auth Error] Error verificando sesión:', error);
        
        // Solo redirigir si estamos en dashboard
        if (window.location.pathname.endsWith('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
}

// 5. Manejador de Login
async function handleLogin(email, password) {
    const errorElement = document.getElementById('errorMessage');
    
    try {
        console.log('[Auth] Intentando login...');
        if (errorElement) errorElement.textContent = '';
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('[Auth] Login exitoso, redirigiendo...');
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('[Auth Error] Error en login:', error);
        
        // Mensajes de error amigables
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor verifica tu email antes de iniciar sesión';
        }
        
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.animation = 'shake 0.5s';
            setTimeout(() => errorElement.style.animation = '', 500);
        }
        
        // Agregar clase de error a los inputs
        document.getElementById('email').classList.add('input-error');
        document.getElementById('password').classList.add('input-error');
        setTimeout(() => {
            document.getElementById('email').classList.remove('input-error');
            document.getElementById('password').classList.remove('input-error');
        }, 2000);
    }
}

// 6. Manejador de Registro
async function handleRegister(email, password, confirmPassword) {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');
    
    try {
        console.log('[Auth] Intentando registro...');
        if (errorElement) errorElement.textContent = '';
        if (successElement) successElement.textContent = '';
        
        // Validaciones
        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard.html'
            }
        });
        
        if (error) throw error;
        
        console.log('[Auth] Registro exitoso');
        if (successElement) {
            successElement.textContent = '¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta.';
        }
        
        // Limpiar formulario
        document.getElementById('registerForm')?.reset();
        
    } catch (error) {
        console.error('[Auth Error] Error en registro:', error);
        
        if (errorElement) {
            errorElement.textContent = error.message;
        }
    }
}

// 7. Manejador de Logout
async function handleLogout() {
    try {
        console.log('[Auth] Cerrando sesión...');
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        console.log('[Auth] Sesión cerrada, redirigiendo...');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('[Auth Error] Error al cerrar sesión:', error);
        showFatalError('Error al cerrar sesión. Por favor recarga la página.');
    }
}

// 8. Configuración de Eventos
function setupAuthEvents() {
    console.log('[Auth] Configurando eventos...');
    
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await handleLogin(email, password);
        });
    }
    
    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            await handleRegister(email, password, confirmPassword);
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLogout();
        });
    }
    
    console.log('[Auth] Eventos configurados');
}

// 9. Estilos dinámicos para errores
function addErrorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .input-error {
            border-color: #ff4444 !important;
            animation: shake 0.5s;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
        }
    `;
    document.head.appendChild(style);
}

// 10. Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Auth] DOM cargado, iniciando sistema...');
    addErrorStyles();
    initializeAuthSystem();
});

// 11. Inicialización por si el evento DOMContentLoaded ya ocurrió
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        if (!window.authState.initialized) {
            console.log('[Auth] Inicializando después de DOMContentLoaded');
            initializeAuthSystem();
        }
    }, 0);
}
