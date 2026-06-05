// "Cosmic Wormhole" - Perfect Loop 60s
// Professional shader for Sleep Music Videos
// A relaxing, perfectly looping infinite tunnel.

#define LOOP_DUR 60.0
#define PI 3.141592653589793
#define TAU (2.0 * PI)

// The period of the tunnel in Z
#define P 40.0
#define K (TAU / P)

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

// Hash functions for noise and stars
float hash(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.x + p.y) * p.z);
}

// Path of the tunnel
vec2 wobble(float z) {
    return vec2(
        sin(z * K * 1.0) * 1.8 + cos(z * K * 2.0) * 0.6,
        cos(z * K * 1.0) * 1.8 + sin(z * K * 3.0) * 0.6
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    // Cinematic crop (black bars)
    if (abs(uv.y) > 0.38) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Perfect loop time variable
    float lt = iTime / LOOP_DUR * TAU;
    float z_time = fract(iTime / LOOP_DUR) * P;
    
    // Camera flies along the tunnel path
    vec3 ro = vec3(wobble(z_time), z_time);
    vec3 target = vec3(wobble(z_time + 2.0), z_time + 2.0);
    
    vec3 ww = normalize(target - ro);
    float roll = sin(z_time * K * 1.0) * 0.4;
    vec3 up = vec3(sin(roll), cos(roll), 0.0);
    vec3 uu = normalize(cross(ww, up));
    vec3 vv = normalize(cross(uu, ww));
    // Wide FOV for an immersive tunnel feeling
    vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.0 * ww); 
    
    float t_march = 0.0;
    vec3 col = vec3(0.0);
    
    // Raymarching loop
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t_march;
        
        // Distance from center of tunnel
        vec2 tun = p.xy - wobble(p.z);
        float tunnelRadius = 3.5;
        float d = tunnelRadius - length(tun);
        
        // Map Z to a circle in 4D to make 3D noise perfectly periodic
        float R = P / TAU;
        vec3 q = vec3(tun.x, tun.y + R * sin(p.z * K), R * cos(p.z * K));
        
        // Morph the space slowly over the loop
        q.xy *= rot(sin(lt) * 0.2);
        
        // Fractal turbulence (ethereal web/clouds)
        float a = 0.5;
        for (int j = 0; j < 5; j++) {
            q += cos(q.yzx * 1.3 + vec3(sin(lt), cos(lt), 0.0)) * 0.4;
            d -= abs(dot(sin(q * a), vec3(0.4))) / a;
            a *= 1.7;
        }
        
        // Slice through boundaries for volumetric accumulation
        float stepSize = min(0.3 * abs(d) + 0.015, 1.0);
        
        t_march += stepSize;
        if (t_march > 35.0) break;
        
        // Accumulation logic
        float accum = 1.0 / (abs(d) + 0.1);
        
        // Deep purple and indigo base palette
        vec3 cavernCol = vec3(0.04, 0.01, 0.08) + vec3(0.08, 0.02, 0.15) * cos(p.z * 0.3 + vec3(0.0, 1.5, 3.0));
        
        // Forward core glow (soft cyan)
        float coreDist = length(tun);
        vec3 coreGlow = vec3(0.0, 0.3, 0.8) * (0.05 / (coreDist * coreDist + 0.1));
        
        // Glowing rhythmic rings along the tunnel walls
        float ring = sin(p.z * K * 12.0 - lt * 4.0); // Moving rings
        float ringGlow = smoothstep(0.9, 1.0, ring) * (0.02 / (abs(d) + 0.02));
        vec3 ringCol = vec3(0.0, 0.6, 1.0) * ringGlow;
        
        float fade = exp(-t_march * 0.08); 
        
        col += (cavernCol * accum + coreGlow + ringCol) * stepSize * 0.4 * fade;
        
        // Periodic glowing fairy dust
        vec3 pos = vec3(p.x, p.y + R*sin(p.z*K), R*cos(p.z*K)) * 2.0;
        vec3 id = floor(pos);
        if (hash(id) > 0.985) {
            vec3 f = fract(pos);
            vec3 center = vec3(hash(id + 1.0), hash(id + 2.0), hash(id + 3.0));
            float pd = length(f - center);
            float pulse = 0.5 + 0.5 * sin(lt * 5.0 + hash(id) * TAU);
            col += vec3(0.4, 0.8, 1.0) * (0.002 / (pd * pd + 0.001)) * pulse * stepSize * fade * 3.0;
        }
    }
    
    // Tonemapping and Post-Processing
    col = tanh(col);
    col = col * col * (3.0 - 2.0 * col); // Contrast curve
    
    // Color grade: cool shadows, warm highlights
    col = mix(col, col * vec3(0.85, 0.95, 1.0), 0.5);
    
    float vig = length(uv);
    col *= smoothstep(1.3, 0.3, vig);
    
    col = pow(max(col, 0.0), vec3(0.4545));
    fragColor = vec4(col, 1.0);
}