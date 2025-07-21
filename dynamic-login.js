// dynamic-login.js
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar que Supabase esté cargado
    if (typeof supabase === 'undefined') {
        console.warn('Supabase no está cargado. Reintentando en 1 segundo...');
        setTimeout(() => window.location.reload(), 1000);
        return;
    }

    try {
        // 2. Obtener datos del Hero desde Supabase
        const { data: heroData, error } = await supabase
            .from('hero_content')
            .select('logo_url')
            .eq('id', 1)
            .single();

        if (error) throw error;

        // 3. Actualizar el logo si existe data
        const logoElement = document.querySelector('.header-logo');
        if (logoElement) {
            if (heroData?.logo_url) {
                let imageUrl = heroData.logo_url;
                
                // Si es una URL de Supabase Storage
                if (!imageUrl.startsWith('http') && imageUrl.includes('hero/')) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('images')
                        .getPublicUrl(imageUrl);
                    imageUrl = publicUrl;
                }
                
                // Asegurar HTTPS y evitar caché
                if (imageUrl.startsWith('http://')) {
                    imageUrl = imageUrl.replace('http://', 'https://');
                }
                
                logoElement.src = `${imageUrl}?t=${Date.now()}`;
                
                // Fallback si la imagen no carga
                logoElement.onerror = () => {
                    logoElement.src = 'assets/MagVet.png';
                };
            }
        }
    } catch (error) {
        console.error('Error cargando logo dinámico:', error);
        // No mostrar error al usuario para no afectar experiencia de login
    }
});