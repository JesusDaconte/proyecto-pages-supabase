document.addEventListener('DOMContentLoaded', async () => {
    // Escuchar actualizaciones de logo desde otras pestañas
    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('logo-update');
        channel.addEventListener('message', (event) => {
            if (event.data.type === 'logo-updated') {
                // Forzar recarga del logo
                const logoElements = document.querySelectorAll('.logo-hero, .header-logo');
                logoElements.forEach(logo => {
                    const currentSrc = logo.src.split('?')[0];
                    logo.src = `${currentSrc}?t=${Date.now()}`;
                });
            }
        });
    }

    if (typeof supabase === 'undefined') {
        console.warn('Supabase no está cargado. Reintentando en 1 segundo...');
        setTimeout(() => window.location.reload(), 500);
        return;
    }

    try {
        // Cargar datos del Hero, About, Services, Contact y Links en paralelo
        const [
            { data: heroData, error: heroError },
            { data: aboutData, error: aboutError },
            { data: servicesData, error: servicesError },
            { data: contactData, error: contactError },
            { data: linksData, error: linksError }
        ] = await Promise.all([
            supabase.from('hero_content').select('*').eq('id', 1).single(),
            supabase.from('about_content').select('content_html, images').eq('id', 1).single(),
            supabase.from('services_content').select('content_html, images').eq('id', 1).single(),
            supabase.from('contact_content').select('*').eq('id', 1).single(),
            supabase.from('links_content').select('maps_embed_url').eq('id', 1).single()
        ]);

        if (heroError) throw heroError;
        if (aboutError) throw aboutError;
        if (servicesError) throw servicesError;
        if (contactError) throw contactError;
        if (linksError) throw linksError;

        // Actualizar Hero Section
        if (heroData) {
            // Función para actualizar logos
            const updateLogos = (logoUrl) => {
                const logoElements = document.querySelectorAll('.logo-hero, .header-logo');
                
                if (!logoUrl) {
                    logoElements.forEach(logo => {
                        logo.src = 'assets/MagVet.png';
                    });
                    return;
                }

                // Procesar la URL de la imagen
                let processedUrl = logoUrl;
                
                // Si es una referencia de Supabase Storage
                if (!logoUrl.startsWith('http') && logoUrl.includes('hero/')) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('images')
                        .getPublicUrl(logoUrl);
                    processedUrl = publicUrl;
                }
                
                // Asegurar HTTPS
                if (processedUrl.startsWith('http://')) {
                    processedUrl = processedUrl.replace('http://', 'https://');
                }
                
                // Forzar actualización con timestamp para evitar cache
                const finalUrl = `${processedUrl}?t=${Date.now()}`;
                
                logoElements.forEach(logo => {
                    logo.src = finalUrl;
                    logo.onerror = () => {
                        logo.src = 'assets/MagVet.png';
                    };
                });
            };

            // Actualizar logo
            updateLogos(heroData.logo_url);

            // Texto
            const titleElement = document.querySelector('.home h1');
            const subtitleElement = document.querySelector('.home h2');
            
            if (titleElement) titleElement.textContent = heroData.title || 'Bienvenido a MagVet';
            if (subtitleElement) subtitleElement.textContent = heroData.subtitle || 'Tu veterinaria de confianza';

            // Enlaces
            if (heroData.links) {
                const buttons = document.querySelectorAll('.botones a');
                
                if (buttons[0] && heroData.links.phone) {
                    buttons[0].href = `tel:${heroData.links.phone.replace(/\D/g, '')}`;
                }
                if (buttons[1] && heroData.links.email) {
                    buttons[1].href = `mailto:${heroData.links.email}`;
                }
                if (buttons[2] && heroData.links.website) {
                    buttons[2].href = heroData.links.website.startsWith('http') ? 
                        heroData.links.website : 
                        `https://${heroData.links.website}`;
                    buttons[2].target = '_blank';
                }
                if (buttons[3] && heroData.links.facebook) {
                    buttons[3].href = heroData.links.facebook.startsWith('http') ? 
                        heroData.links.facebook : 
                        `https://facebook.com/${heroData.links.facebook.replace('@', '')}`;
                    buttons[3].target = '_blank';
                }
                if (buttons[4] && heroData.links.instagram) {
                    buttons[4].href = heroData.links.instagram.startsWith('http') ? 
                        heroData.links.instagram : 
                        `https://instagram.com/${heroData.links.instagram.replace('@', '')}`;
                    buttons[4].target = '_blank';
                }
                if (buttons[5] && heroData.links.whatsapp) {
                    buttons[5].href = `https://wa.me/${heroData.links.whatsapp.replace(/\D/g, '')}`;
                    buttons[5].target = '_blank';
                }
            }
        }

        // Actualizar About Section
        if (aboutData) {
            // Contenido HTML
            const aboutContent = document.getElementById('about-content');
            if (aboutContent) {
                aboutContent.innerHTML = aboutData.content_html || '';
            }
            
            // Imágenes
            const imagesContainer = document.querySelector('#about .imagenes');
            if (imagesContainer) {
                imagesContainer.innerHTML = '';
                
                const imagesToShow = aboutData.images?.length > 0 
                    ? aboutData.images.slice(0, 3) 
                    : [
                        'assets/veterinaria-MagVet.jpg',
                        'assets/gatos-Mag-Vet.jpg', 
                        'assets/perros-MagVet.jpg'
                      ];
                
                imagesToShow.forEach(imgUrl => {
                    const img = document.createElement('img');
                    // Procesar URL de imagen
                    let finalUrl = imgUrl;
                    if (!imgUrl.startsWith('http') && imgUrl.includes('about/')) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('images')
                            .getPublicUrl(imgUrl);
                        finalUrl = publicUrl;
                    }
                    
                    if (finalUrl.startsWith('http://')) {
                        finalUrl = finalUrl.replace('http://', 'https://');
                    }
                    
                    img.src = `${finalUrl}?t=${Date.now()}`;
                    img.className = 'about-img';
                    img.alt = 'MagVet';
                    img.onerror = () => { 
                        img.src = 'assets/default-image.jpg'; 
                    };
                    imagesContainer.appendChild(img);
                });
            }
        }

        // Actualizar Services Section
        if (servicesData) {
            // Contenido HTML
            const servicesContent = document.getElementById('services-content');
            if (servicesContent) {
                servicesContent.innerHTML = servicesData.content_html || '';
            }
            
            // Imágenes
            const servicesImagesContainer = document.querySelector('#services .imagenes');
            if (servicesImagesContainer) {
                servicesImagesContainer.innerHTML = '';
                
                const imagesToShow = servicesData.images?.length > 0 
                    ? servicesData.images.slice(0, 3) 
                    : [
                        'assets/veterinaria2-MagVet.jpg',
                        'assets/gatitos-MagVet.jpg', 
                        'assets/perritos-MagVet.jpg'
                      ];
                
                imagesToShow.forEach(imgUrl => {
                    const img = document.createElement('img');
                    // Procesar URL de imagen
                    let finalUrl = imgUrl;
                    if (!imgUrl.startsWith('http') && imgUrl.includes('services/')) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('images')
                            .getPublicUrl(imgUrl);
                        finalUrl = publicUrl;
                    }
                    
                    if (finalUrl.startsWith('http://')) {
                        finalUrl = finalUrl.replace('http://', 'https://');
                    }
                    
                    img.src = `${finalUrl}?t=${Date.now()}`;
                    img.className = 'services-img';
                    img.alt = 'MagVet Services';
                    img.onerror = () => { 
                        img.src = 'assets/default-image.jpg'; 
                    };
                    servicesImagesContainer.appendChild(img);
                });
            }
        }

        // Actualizar Contact Section
        if (contactData) {
            // Actualizar teléfono
            const phoneLink = document.getElementById('phone-link');
            const phoneText = document.getElementById('phone-text');
            if (phoneLink && contactData.phone) {
                phoneLink.href = `tel:${contactData.phone.replace(/\D/g, '')}`;
                phoneText.textContent = contactData.phone_text || contactData.phone;
            }
            
            // Actualizar email
            const emailLink = document.getElementById('email-link');
            const emailText = document.getElementById('email-text');
            if (emailLink && contactData.email) {
                emailLink.href = `mailto:${contactData.email}`;
                emailText.textContent = contactData.email_text || contactData.email;
            }
            
            // Actualizar WhatsApp
            const whatsappLink = document.getElementById('whatsapp-link');
            const whatsappText = document.getElementById('whatsapp-text');
            if (whatsappLink && contactData.whatsapp) {
                whatsappLink.href = `https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`;
                whatsappText.textContent = contactData.whatsapp_text || contactData.whatsapp;
            }
        }

        // Actualizar Google Maps
        if (linksData && linksData.maps_embed_url) {
            const mapsIframe = document.getElementById('google-maps-iframe');
            if (mapsIframe) {
                const srcMatch = linksData.maps_embed_url.match(/src="([^"]*)"/);
                if (srcMatch && srcMatch[1]) {
                    mapsIframe.src = srcMatch[1];
                }
            }
        }

    } catch (error) {
        console.error('Error cargando contenido dinámico:', error);
        
        // Mostrar notificación de error al usuario
        const errorElement = document.createElement('div');
        errorElement.style.position = 'fixed';
        errorElement.style.bottom = '20px';
        errorElement.style.right = '20px';
        errorElement.style.padding = '10px';
        errorElement.style.backgroundColor = '#ff4444';
        errorElement.style.color = 'white';
        errorElement.style.borderRadius = '5px';
        errorElement.textContent = 'Error cargando contenido. Recargue la página.';
        document.body.appendChild(errorElement);
        
        setTimeout(() => errorElement.remove(), 5000);
    }
});