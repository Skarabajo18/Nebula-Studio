// Neon Hex - Bucle Oscilante (Oscillating Loop)
// Variante generada a partir de efecto-4.glsl
// Presenta una geometría hexagonal, dos entidades orbitando y colores neón (cyberpunk).
// Duración exacta del bucle: 20.0 segundos.

void mainImage(out vec4 o, vec2 u) {
    // Período base: 20 segundos
    const float T  = 20.0;
    const float k  = 6.28318530718 / T; 

    // El tiempo siempre está restringido al bucle
    float t = mod(iTime, T);

    float d=0.0, a, e=0.0, i=0.0, s=0.0;
    vec3  p = iResolution;

    u = (u+u-p.xy)/p.y;

    // cinematic bars (un poco más anchas para look más cinemático)
    if (abs(u.y) > .85) { o = vec4(0); return; }

    // Camera roll (giro de cámara) y wobble
    u *= mat2(cos(k*t), -sin(k*t), sin(k*t), cos(k*t));
    u += vec2(sin(2.*k*t)*.2, cos(3.*k*t)*.2);

    for(o*=i; i++<128.;
        d += s = min(.01+.3*abs(s), e=max(.8*e,.01)),
        // Colores Neón (Arcoiris cibernético: fases 0, 2, 4)
        o += (1.+cos(0.2*p.z + vec4(0, 2, 4, 0))) / (s+e*2.))

        for (
            // Z oscila (viaje hacia adelante y hacia atrás)
            p = vec3(u*d, d + 15. + sin(k*t)*10.),

            // Entidades: Dos esferas orbitando cruzadas
            e = min(
                length(p - vec3( sin(2.*k*t)*2.,  cos(3.*k*t)*2., 15.+sin(k*t)*10.)) - 0.15,
                length(p - vec3(-sin(2.*k*t)*2., -cos(3.*k*t)*2., 15.+sin(k*t)*10.)) - 0.15
            ),

            // Torsión espacial
            p.xy *= mat2(cos(k*t + p.z/10. + vec4(0,33,11,0))),

            // Geometría: Túnel Hexagonal
            s = 4.0 - max(abs(p.x), abs(p.x)*0.5 + abs(p.y)*0.866),

            // Bucle de ruido (5 octavas)
            a = .5; a < 20.; a += a)

            // turbulencia orgánica
            p += sin(3.*k*t + p.yzx)*.2,

            // ruido fractal que rompe el hexágono
            s -= abs(dot(sin(k*t*2. + p*a), vec3(.15))) / a;

    // Tonemap, viñeta y saturación
    u += (u.yx*.9+.3-vec2(-1.,.5));
    o = tanh(o/5./max(dot(u,u), .001));
}
