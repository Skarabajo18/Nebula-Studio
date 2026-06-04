void mainImage(out vec4 o, vec2 u) {

    // Período base: 20 segundos
    // k = 2*PI/T -> todas las frecuencias son múltiplos de k -> loop exacto
    const float T  = 20.0;
    const float k  = 6.28318530718 / T;  // = 2*PI / 20

    float t = mod(iTime, T);

    float d,a,e,i,s;
    vec3  p = iResolution;

    u = (u+u-p.xy)/p.y;

    if (abs(u.y) > .8) { o = vec4(0); return; }

    // camera movement — frecuencias 2k y 4k (múltiplos enteros de k)
    u += vec2(cos(2.*k*t)*.3, cos(4.*k*t)*.1);

    for(o*=i; i++<128.;
        d += s = min(.01+.4*abs(s),e=max(.8*e,.01)),
        o += (1.+cos(.1*p.z*vec4(3,1,0,0)))/(s+e*2.))

        for (
            // Z oscila en lugar de avanzar: 12 + sin(k*t)*8
            // mismo rango visual que el original (12 ± 8) pero periódico
            p = vec3(u*d, d + 12. + sin(k*t)*8.),

            // orb — frecuencias k, 2k, 3k (múltiplos enteros)
            e = length(p - vec3(
                sin(sin(k*t) + 2.*k*t) * 2.,
                1. + sin(sin(2.*k*t) + k*t) * 2.,
                12. + sin(k*t)*8.))-.1,

            // spin — frecuencia k (múltiplo entero)
            p.xy *= mat2(cos(k*t + p.z/16. + vec4(0,33,11,0))),

            s = 4. - abs(p.y),
            a = .42; a < 16.; a += a)

            // turbulencia — frecuencia 2k (múltiplo entero)
            p += cos(2.*k*t + p.yzx)*.3,

            // noise — frecuencia k (múltiplo entero)
            s -= abs(dot(sin(k*t + p*a), .18+p-p)) / a;

    u += (u.yx*.9+.3-vec2(-1.,.5));
    o = tanh(o/6./max(dot(u,u), .001));
}