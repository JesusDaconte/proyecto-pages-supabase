document.addEventListener('DOMContentLoaded', function() {
    function checkSupabase() {
        if (typeof supabase !== 'undefined') {
            initializeAuth();
        } else {
            setTimeout(checkSupabase, 100);
        }
    }
    checkSupabase();
});

function initializeAuth() {
    // =====================
    // 1. Verificación de Sesión
    // =====================
    async function checkSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            const isLoginPage = window.location.pathname.endsWith('login.html');
            const isRegisterPage = window.location.pathname.endsWith('register.html');
            const isDashboardPage = window.location.pathname.endsWith('dashboard.html');

            // Redirigir si ya está autenticado
            if ((isLoginPage || isRegisterPage) && session) {
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Redirigir si no está autenticado
            if (isDashboardPage && !session) {
                window.location.href = 'login.html';
                return;
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
            if (window.location.pathname.endsWith('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    // =====================
    // 2. Cerrar Sesión
    // =====================
    async function handleLogout() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) throw error;
            
            window.location.href = 'login.html';
            
            // Forzar recarga para limpiar el estado
            setTimeout(() => {
                window.location.reload(true);
            }, 500);
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión: ' + error.message);
        }
    }

    // =====================
    // 3. Iniciar Sesión
    // =====================
    async function handleLogin(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            window.location.href = 'dashboard.html';
        } catch (error) {
            const errorElement = document.getElementById('errorMessage');
            if (errorElement) {
                errorElement.textContent = error.message;
            }
        }
    }

    // =====================
    // 4. Registro con Verificación
    // =====================
    async function handleRegister(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin + '/dashboard.html'
                }
            });
            
            if (error) throw error;
            
            return { 
                success: true,
                message: '¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta.'
            };
            
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    // =====================
    // 5. Configuración de Eventos
    // =====================
    function setupAuthEvents() {
        // Configurar Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                await handleLogin(email, password);
            });
        }

        // Configurar Registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // Limpiar mensajes
                const errorElement = document.getElementById('errorMessage');
                const successElement = document.getElementById('successMessage');
                
                if (errorElement) errorElement.textContent = '';
                if (successElement) successElement.textContent = '';
                
                // Validaciones
                if (password !== confirmPassword) {
                    if (errorElement) errorElement.textContent = 'Las contraseñas no coinciden';
                    return;
                }
                
                if (password.length < 6) {
                    if (errorElement) errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres';
                    return;
                }
                
                try {
                    const result = await handleRegister(email, password);
                    
                    if (successElement) {
                        successElement.textContent = result.message;
                        registerForm.reset();
                    }
                    
                } catch (error) {
                    console.error('Error completo:', error);
                    if (errorElement) {
                        errorElement.textContent = error.message || 'Error durante el registro';
                    }
                }
            });
        }

        // Configurar Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                await handleLogout();
            });
        }
    }

    // Inicialización
    checkSession();
    setupAuthEvents();
}
