/**
 * Optimiza una imagen antes de subirla a Supabase
 * @param {File} file - Archivo de imagen a optimizar
 * @param {Object} options - Opciones de optimización
 * @param {number} options.maxWidth - Ancho máximo (default: 1200)
 * @param {number} options.quality - Calidad WebP (0.6-0.9, default: 0.8)
 * @param {string} options.type - Tipo de salida ('webp'|'jpeg'|'png', default: 'webp')
 * @returns {Promise<File>} - Archivo optimizado
 */
async function optimizeImage(file, options = {}) {
    const { maxWidth = 1200, quality = 0.8, type = 'webp' } = options;
    const mimeType = `image/${type}`;
    
    return new Promise((resolve, reject) => {
        if (!file.type.match('image.*')) {
            return reject(new Error('El archivo no es una imagen válida'));
        }

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const img = new Image();
                img.src = event.target.result;
                
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Error al cargar la imagen'));
                });

                // Calcular nuevas dimensiones manteniendo aspect ratio
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Crear canvas para el redimensionamiento
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Aplicar suavizado
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a formato deseado
                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Error en la conversión de imagen'));
                    }
                    
                    const optimizedFile = new File([blob], generateOptimizedFileName(file.name, type), {
                        type: mimeType,
                        lastModified: Date.now()
                    });
                    
                    resolve(optimizedFile);
                }, mimeType, quality);
                
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Genera un nombre de archivo optimizado
 * @param {string} originalName - Nombre original del archivo
 * @param {string} type - Tipo de imagen ('webp'|'jpeg'|'png')
 * @returns {string} - Nuevo nombre de archivo
 */
function generateOptimizedFileName(originalName, type) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}-optimized-${timestamp}.${type}`;
}

/**
 * Sube una imagen optimizada a Supabase Storage
 * @param {File} file - Archivo de imagen original
 * @param {string} folder - Carpeta de destino en Supabase
 * @param {Object} options - Opciones de optimización
 * @returns {Promise<string>} - URL pública de la imagen
 */
async function uploadOptimizedImage(file, folder = 'general', options = {}) {
    try {
        // Optimizar la imagen antes de subir
        const optimizedFile = await optimizeImage(file, options);
        
        // Generar nombre único para el archivo
        const fileName = `${folder}-${Date.now()}.${options.type || 'webp'}`;
        const filePath = `${folder}/${fileName}`;

        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, optimizedFile, {
                cacheControl: '3600',
                upsert: false,
                contentType: optimizedFile.type
            });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return publicUrl.startsWith('http') ?
            publicUrl.replace('http://', 'https://') :
            `https://${publicUrl}`;

    } catch (error) {
        console.error('Error en uploadOptimizedImage:', error);
        throw error;
    }
}

// Exportar funciones si es un módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { optimizeImage, uploadOptimizedImage };
}