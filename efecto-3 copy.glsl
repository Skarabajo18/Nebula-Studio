void mainImage(out vec4 o, vec2 u) {
    float d,a,e,i,s,t = mod(iTime, 5.0);
    vec3  p = iResolution;    
    
    // Frecuencia base para 5 segundos (2*PI / 5.0)
    float W = 1.25663706; 
    
    // Coordenadas circulares del tiempo para el ruido infinito
    float timeCos = cos(t * W);
    float timeSin = sin(t * W);
    
    // scale coords
    u = (u+u-p.xy)/p.y;
    
    // cinema bars
    if (abs(u.y) > .8) { o = vec4(0); return; }
    
    // camera movement (Sincronizado)
    u += vec2(timeCos * .3, sin(t * W * 2.) * .1);
    
    for(o*=i; i++<128.;

        // accumulate distance
        d += s = min(.01+.4*abs(s),e=max(.8*e, .01)),
        
        // purple, blue color
        o += (1.+cos(.1*p.z*vec4(3,1,0,0)))/(s+e*2.))
        
        
        // noise loop start, march
        // Reemplazamos el avance lineal en Z (+t) por una oscilación suave
        for (p = vec3(u*d, d + timeSin * 2.0), 
    
            // entity (orb)
            // Eliminamos el '+ t' lineal y lo cambiamos por armónicos cerrados
            e = length(p - vec3(
                sin(timeSin + t * W * 2.) * 2.,
                1. + sin(timeCos + t * W) * 2.,
                12. + timeCos * 4.)) - .1, 
            
            // spin by t, twist by p.z
            p.xy *= mat2(cos(t * W + p.z/16.+vec4(0,33,11,0))),
            
            // mirrored planes 4 units apart
            s = 4. - abs(p.y),
            
            // noise starts at .42 up to 16., grow by a+=a
            a = .42; a < 16.; a += a)
            
            // apply turbulence 
            p += cos(t * W + p.yzx) * .3,
            
            // apply noise
            // Usamos las coordenadas circulares para el desplazamiento del ruido
            s -= abs(dot(sin(p * a + vec3(timeCos, timeSin, timeCos) * 1.5), .18+p-p)) / a;
    
    // tanh tonemap, brightness, light off-screen
    u += (u.yx*.9+.3-vec2(-1.,.5));
    o = tanh(o/6./max(dot(u,u), .001));
}