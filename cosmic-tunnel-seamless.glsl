// Cosmic Tunnel - Bucle Infinito (Perfect Seamless Loop)
// Basado en "efecto-2.glsl" pero rediseñado matemáticamente para ser un bucle infinito sin cortes.
// Ideal para grabar y loopear.
// Duración exacta del bucle: 20.0 segundos.

#define LOOP_TIME 20.0
#define TWO_PI 6.28318530718

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // t_norm va de 0.0 a 1.0 exactos en cada ciclo de 20 segundos
    float t_norm = fract(iTime / LOOP_TIME);
    // t_loop va de 0.0 a 2*PI, garantizando que todas las funciones trigonométricas (sin/cos) se cierren perfectamente.
    float t_loop = t_norm * TWO_PI;
    
    vec2 u = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    
    // Barras de cine
    if (abs(u.y) > 0.8) { fragColor = vec4(0.0); return; }
    
    // Movimiento de cámara (oscilación perfecta)
    u += vec2(cos(t_loop * 1.0) * 0.3, cos(t_loop * 2.0) * 0.1);
    
    vec3 p;
    float d = 0.0, a, e = 0.0, s = 0.0;
    vec4 o = vec4(0.0);
    
    // La cámara avanza exactamente 4 periodos espaciales (4 * TWO_PI) por cada bucle de 20 segundos.
    // Esto asegura que la geometría fractal encaje al final del clip.
    float timeZ = t_norm * 4.0 * TWO_PI;
    
    for(float i = 0.0; i < 128.0; i++) {
        // Acumular distancia no-lineal
        s = 0.01 + 0.4 * abs(s);
        d += s;
        
        p = vec3(u * d, d + timeZ);
        
        // Entidad (Orbe) flotante
        // Su posición usa frecuencias enteras de t_loop para loopear 100% perfecto
        vec3 orb_pos = vec3(
            sin(sin(t_loop * 1.0) + t_loop * 2.0) * 2.0,
            1.0 + sin(sin(t_loop * 2.0) + t_loop * 1.0) * 2.0,
            d + timeZ + 12.0 + cos(t_loop * 1.0) * 8.0
        );
        e = length(p - orb_pos) - 0.1;
        
        // Torsión (Twist) del espacio
        // 0.25 calza perfectamente porque p.z avanza 4 * TWO_PI. (0.25 * 4 = 1 ciclo completo)
        p.xy *= rot(t_loop * 1.0 + p.z * 0.25);
        
        // Planos paralelos espejados
        s = 4.0 - abs(p.y);
        
        // Bucle de ruido fractal (usando múltiplos de base 2 para encaje perfecto)
        float noiseSum = 0.0;
        for (a = 1.0; a <= 32.0; a *= 2.0) {
            // Turbulencia animada
            p += cos(t_loop * 1.0 + p.yzx) * 0.3;
            
            // Ruido acumulado
            noiseSum += abs(dot(sin(t_loop * 1.0 + p * a), vec3(0.18))) / a;
        }
        // Factor de compensación para igualar la intensidad del ruido del original
        s -= noiseSum * 2.37;
        
        // Coloración Morado/Azul (dependiente de Z y del Tiempo)
        vec4 colorPhase = vec4(0.25, 0.25, 0.0, 0.0) * p.z - t_loop * vec4(2.0, 1.0, 0.0, 0.0);
        o += (1.0 + cos(colorPhase)) / (s + e * 2.0);
    }
    
    // Tonemap y ajuste de brillo (efecto viñeta)
    u += (u.yx * 0.9 + 0.3 - vec2(-1.0, 0.5));
    fragColor = tanh(o / 6.0 / max(dot(u, u), 0.001));
}
