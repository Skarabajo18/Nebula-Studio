export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform vec2 iResolution;
  uniform float iTime;
  uniform sampler2D iChannel0;

  // General controls
  uniform float u_mode; // 0.0 = Milky Way, 1.0 = Galaxy, 2.0 = Cosmic Tunnel
  uniform float u_speed;
  uniform float u_brightness;
  uniform vec3 u_color_tint;

  // Background Stars controls
  uniform float u_star_density;    
  uniform float u_star_brightness; 
  uniform float u_star_speed;      

  // Galaxy Mode controls
  uniform float u_galaxy_swirl;
  uniform float u_galaxy_swirl_speed;
  uniform float u_galaxy_max_intensity;
  uniform float u_galaxy_light_intensity;
  uniform vec3 u_galaxy_col1;
  uniform vec3 u_galaxy_col2;

  // Milky Way Mode controls
  uniform float u_milkyway_offset;
  uniform float u_milkyway_swirl;
  uniform float u_milkyway_speed;
  uniform vec3 u_milkyway_palette_a;
  uniform vec3 u_milkyway_palette_b;
  uniform vec3 u_milkyway_palette_c;
  uniform vec3 u_milkyway_palette_d;
  uniform vec3 u_milkyway_bg_blue;
  uniform vec3 u_milkyway_bg_white;

  // Cosmic Tunnel Mode controls
  uniform float u_tunnel_cam_shake;
  uniform float u_tunnel_width;
  uniform float u_tunnel_distortion;
  uniform float u_tunnel_orb_size;
  uniform float u_tunnel_color_cycle;
  uniform vec3 u_tunnel_color_vec;
  uniform float u_tunnel_glow;
  uniform float u_tunnel_show_star;
  uniform float u_loop_duration;

  varying vec2 vUv;

  struct PointLight {
      vec2 pos;
      vec3 col;
      float intensity;
  };

  float palette( in float a, in float b, in float c, in float d, in float x ) {
      return a + b * cos(6.28318 * (c * x + d));
  }
      
  // 2D Noise from IQ
  float Noise2D( in vec2 x )
  {
      ivec2 p = ivec2(floor(x));
      vec2 f = fract(x);
      f = f*f*(3.0-2.0*f);
      ivec2 uv = p.xy;
      
      float rgA = texelFetch( iChannel0, (uv+ivec2(0,0))&255, 0 ).x;
      float rgB = texelFetch( iChannel0, (uv+ivec2(1,0))&255, 0 ).x;
      float rgC = texelFetch( iChannel0, (uv+ivec2(0,1))&255, 0 ).x;
      float rgD = texelFetch( iChannel0, (uv+ivec2(1,1))&255, 0 ).x;
      return mix( mix( rgA, rgB, f.x ),
                  mix( rgC, rgD, f.x ), f.y );
  }

  float ComputeFBM( in vec2 pos )
  {
      float amplitude = 0.75;
      float sum = 0.0;
      float maxAmp = 0.0;
      for(int i = 0; i < 6; ++i)
      {
          sum += Noise2D(pos) * amplitude;
          maxAmp += amplitude;
          amplitude *= 0.5;
          pos *= 2.2;
      }
      return sum / maxAmp;
  }

  float ComputeFBMStars( in vec2 pos )
  {
      float amplitude = 0.75;
      float sum = 0.0;
      float maxAmp = 0.0;
      for(int i = 0; i < 5; ++i)
      {
          sum += Noise2D(pos) * amplitude;
          maxAmp += amplitude;
          amplitude *= 0.5;
          pos *= 2.0;
      }
      return sum / maxAmp * 1.15;
  }

  vec3 BackgroundColor( in vec2 uv ) {
      float noise1 = ComputeFBMStars(uv * 5.0);
      float noise2 = ComputeFBMStars(uv * vec2(15.125, 25.7));
      float noise3 = ComputeFBMStars((uv + vec2(0.5, 0.1)) * 4.0 + iTime * u_speed * u_star_speed * 0.35);
      float starShape = noise1 * noise2 * noise3;
      
      float falloffRadius = 0.2;
      float baseThreshold = mix(0.85, 0.45, u_star_density);
      
      starShape = clamp(starShape - baseThreshold + falloffRadius, 0.0, 1.0);
      
      float weight = starShape / (2.0 * falloffRadius);
      return weight * vec3(noise1 * 0.55, noise2 * 0.4, noise3 * 1.0) * u_star_brightness;
  }

  vec4 RenderCosmicTunnel(vec2 fragCoord, float timeOffset) {
      float d = 0.0;
      float e = 0.0;
      float s = 0.0;
      float t = timeOffset;
      
      vec3 p = vec3(iResolution, 0.0);
      
      // scale coordinates to preserve aspect ratio
      vec2 u = fragCoord.xy;
      u = (u + u - p.xy) / p.y;
      
      // cinema bars
      if (abs(u.y) > 0.8) {
          return vec4(0.0, 0.0, 0.0, 1.0);
      }
      
      // camera shake
      u += vec2(cos(t * 0.4) * 0.3, cos(t * 0.8) * 0.1) * u_tunnel_cam_shake;
      
      vec4 o = vec4(0.0);
      
      // Raymarching loop
      for (int i = 0; i < 128; i++) {
          p = vec3(u * d, d + t);
          
          e = length(p - vec3(
              sin(sin(t * 0.2) + t * 0.4) * 2.0,
              1.0 + sin(sin(t * 0.5) + t * 0.2) * 2.0,
              12.0 + t + cos(t * 0.3) * 8.0
          )) - u_tunnel_orb_size;
          
          p.xy *= mat2(cos(0.1 * t + p.z / 16.0 + vec4(0.0, 33.0, 11.0, 0.0)));
          
          s = u_tunnel_width - abs(p.y);
          
          for (float a = 0.42; a < 16.0; a += a) {
              p += cos(0.4 * t + p.yzx) * u_tunnel_distortion;
              s -= abs(dot(sin(0.1 * t + p * a), vec3(0.18))) / a;
          }
          
          if (u_tunnel_show_star > 0.5) {
              e = max(0.8 * e, 0.01);
              s = min(0.01 + 0.4 * abs(s), e);
              d += s;
          } else {
              s = 0.01 + 0.4 * abs(s);
              d += s;
          }
          o += (1.0 + cos(u_tunnel_color_cycle * p.z * vec4(u_tunnel_color_vec, 0.0))) / (s + e * 2.0);
      }
      
      u += (u.yx * 0.9 + 0.3 - vec2(-1.0, 0.5));
      return tanh(o / u_tunnel_glow / max(dot(u, u), 0.001));
  }

  vec4 RenderCosmicTunnelSeamless(vec2 fragCoord, float iTimeReal, float loopDuration) {
      float d = 0.0;
      float e = 0.0;
      float s = 0.0;
      
      // La matemática sincronizada diseñada por el usuario
      float t = mod(iTimeReal, loopDuration);
      float W = 6.283185307 / loopDuration; // Frecuencia base paramétrica
      
      // Coordenadas circulares del tiempo para el ruido infinito
      float timeCos = cos(t * W);
      float timeSin = sin(t * W);
      
      vec3 p = vec3(iResolution, 0.0);
      vec2 u = fragCoord.xy;
      u = (u + u - p.xy) / p.y;
      
      if (abs(u.y) > 0.8) return vec4(0.0, 0.0, 0.0, 1.0);
      
      // Camera movement
      u += vec2(timeCos * 0.3, sin(t * W * 2.0) * 0.1) * u_tunnel_cam_shake;
      
      vec4 o = vec4(0.0);
      
      for (int i = 0; i < 128; i++) {
          // Reemplazamos el avance lineal en Z (+t) por una oscilación suave
          p = vec3(u * d, d + timeSin * 2.0);
          
          // Entity (Orb) - Armónicos cerrados
          e = length(p - vec3(
              sin(timeSin + t * W * 2.0) * 2.0,
              1.0 + sin(timeCos + t * W) * 2.0,
              12.0 + timeCos * 4.0
          )) - u_tunnel_orb_size;
          
          // Spin by t, twist by p.z
          p.xy *= mat2(cos(t * W + p.z / 16.0 + vec4(0.0, 33.0, 11.0, 0.0)));
          
          s = u_tunnel_width - abs(p.y);
          
          for (float a = 0.42; a < 16.0; a += a) {
              // Apply turbulence
              p += cos(t * W + p.yzx) * u_tunnel_distortion;
              
              // Apply noise usando coordenadas circulares
              s -= abs(dot(sin(p * a + vec3(timeCos, timeSin, timeCos) * 1.5), vec3(0.18))) / a;
          }
          
          if (u_tunnel_show_star > 0.5) {
              d += s = min(0.01 + 0.4 * abs(s), e = max(0.8 * e, 0.01));
          } else {
              d += s = 0.01 + 0.4 * abs(s);
          }
          o += (1.0 + cos(u_tunnel_color_cycle * p.z * vec4(u_tunnel_color_vec, 0.0))) / (s + e * 2.0);
      }
      
      u += (u.yx * 0.9 + 0.3 - vec2(-1.0, 0.5));
      return tanh(o / u_tunnel_glow / max(dot(u, u), 0.001));
  }

  vec4 RenderEffect4Seamless(vec2 fragCoord, float iTimeReal, float loopDuration) {
      // k = 2*PI/T -> all frequencies are multiples of k -> perfect loop
      float T = loopDuration;
      float k = 6.28318530718 / T;
      float t = mod(iTimeReal, T);

      float d = 0.0, e = 0.0, s = 0.0;
      vec3 p = vec3(iResolution, 0.0);
      vec2 u = fragCoord.xy;
      u = (u + u - p.xy) / p.y;

      if (abs(u.y) > 0.8) { return vec4(0.0, 0.0, 0.0, 1.0); }

      // camera movement (frequencies 2k and 4k)
      u += vec2(cos(2.0 * k * t) * 0.3, cos(4.0 * k * t) * 0.1) * u_tunnel_cam_shake;

      vec4 o = vec4(0.0);

      for(int i = 0; i < 128; i++) {
          if (u_tunnel_show_star > 0.5) {
              e = max(0.8 * e, 0.01);
              s = min(0.01 + 0.4 * abs(s), e);
              d += s;
          } else {
              s = 0.01 + 0.4 * abs(s);
              d += s;
          }
          
          // Z oscillates instead of moving forward
          p = vec3(u * d, d + 12.0 + sin(k * t) * 8.0);

          // orb (frequencies k, 2k, 3k)
          e = length(p - vec3(
              sin(sin(k * t) + 2.0 * k * t) * 2.0,
              1.0 + sin(sin(2.0 * k * t) + k * t) * 2.0,
              12.0 + sin(k * t) * 8.0
          )) - u_tunnel_orb_size;

          // spin (frequency k)
          vec4 rotParams = vec4(0.0, 33.0, 11.0, 0.0);
          float angle = k * t + p.z / 16.0;
          p.xy *= mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

          s = u_tunnel_width - abs(p.y);
          
          for (float a = 0.42; a < 16.0; a += a) {
              // turbulence (frequency 2k)
              p += cos(2.0 * k * t + p.yzx) * u_tunnel_distortion;

              // noise (frequency k)
              s -= abs(dot(sin(k * t + p * a), vec3(0.18))) / a;
          }

          o += (1.0 + cos(u_tunnel_color_cycle * p.z * vec4(u_tunnel_color_vec, 0.0))) / (s + e * 2.0);
      }

      u += (u.yx * 0.9 + 0.3 - vec2(-1.0, 0.5));
      return tanh(o / u_tunnel_glow / max(dot(u, u), 0.001));
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 scrPt = uv * 2.0 - 1.0;
      
      vec4 finalColor = vec4(0.0);
      
      if (u_mode > 3.5) {
          // EFFECT-4
          finalColor = RenderEffect4Seamless(fragCoord, iTime, u_loop_duration);
          
      } else if (u_mode > 2.5) {
          // BUCLE VERDADERO ESPACIAL CÍCLICO
          // Renderiza el flujo hiperdimensional continuo, ¡Cero fantasmas, Cero cortes!
          finalColor = RenderCosmicTunnelSeamless(fragCoord, iTime, u_loop_duration);
          
      } else if (u_mode > 1.5) {
          // COSMIC TUNNEL MODE (NORMAL)
          float t = iTime * u_speed;
          finalColor = RenderCosmicTunnel(fragCoord, t);
          
      } else if (u_mode > 0.5) {
          // GALAXY MODE
          vec2 samplePt = scrPt;
          float dist = length(samplePt);
          float theta = dist * u_galaxy_swirl - iTime * u_speed * u_galaxy_swirl_speed;
          mat2 rot;
          
          float cosTheta = cos(theta);
          float sinTheta = sin(theta);
          
          rot[0][0] = cosTheta;
          rot[0][1] = -sinTheta;
          rot[1][0] = sinTheta;
          rot[1][1] = cosTheta;
          
          samplePt *= rot;
          samplePt *= 3.0;
          
          float noiseVal = ComputeFBM(samplePt + sin(iTime * u_speed * 0.03125));
          noiseVal *= clamp(pow(u_galaxy_max_intensity - dist, 5.0) * (1.0 / u_galaxy_max_intensity), 0.0, 1.0);
          
          PointLight l1;
          l1.pos = vec2(0);
          l1.col = mix(u_galaxy_col1, u_galaxy_col2, clamp(dist * 0.5, 0.0, 1.0) + (sin(iTime * u_speed * 0.5) * 0.5 + 0.5) * 0.5);
          l1.intensity = u_galaxy_light_intensity;
          
          vec3 l1Col = l1.col * l1.intensity * 1.0 / pow(length(l1.pos - samplePt), 0.5);
          
          finalColor = vec4(mix(BackgroundColor(fragCoord.xy * 0.125), l1Col * noiseVal, pow(noiseVal, 1.0)), 1.0);
          
      } else {
          // MILKY WAY MODE
          float galaxyOffset = (cos(scrPt.x * 5.0) * sin(scrPt.x * 2.0) * 0.5 + 0.5) * u_milkyway_offset;
          float theta = length(scrPt) * u_milkyway_swirl; 
          mat2 rot;
          
          float cosTheta = cos(theta);
          float sinTheta = sin(theta);
          
          rot[0][0] = cosTheta;
          rot[0][1] = -sinTheta;
          rot[1][0] = sinTheta;
          rot[1][1] = cosTheta;
          
          vec2 rotatedScrPt = scrPt * rot;
          
          float noiseVal = ComputeFBM(rotatedScrPt * 5.0 + 50.0 + iTime * u_speed * u_milkyway_speed * 0.0234375);
          
          rotatedScrPt += vec2(noiseVal) * 0.3;
          
          float centralFalloff = clamp(1.0 - length(scrPt.y + galaxyOffset), 0.0, 1.0);
          float xDirFalloff = (cos(scrPt.x * 2.0) * 0.5 + 0.5);
          
          float centralFalloff_rot = 1.0 - length(rotatedScrPt.y + galaxyOffset);
          float xDirFalloff_rot = (cos(rotatedScrPt.x * 2.0) * 0.5 + 0.5);
          
          float lowFreqNoiseForFalloff = ComputeFBM(rotatedScrPt * 4.0 - iTime * u_speed * u_milkyway_speed * 0.0234375);
          float milkywayShape = clamp(pow(centralFalloff_rot, 3.0) - lowFreqNoiseForFalloff * 0.5, 0.0, 1.0) * xDirFalloff_rot;
          
          vec3 color;
          
          color.r = palette(u_milkyway_palette_a.r, u_milkyway_palette_b.r, u_milkyway_palette_c.r, u_milkyway_palette_d.r, pow(milkywayShape, 1.0));
          color.g = palette(u_milkyway_palette_a.g, u_milkyway_palette_b.g, u_milkyway_palette_c.g, u_milkyway_palette_d.g, pow(milkywayShape, 1.0));
          color.b = palette(u_milkyway_palette_a.b, u_milkyway_palette_b.b, u_milkyway_palette_c.b, u_milkyway_palette_d.b, pow(milkywayShape, 1.0));
          
          float removeColor = (pow(milkywayShape, 10.0) + lowFreqNoiseForFalloff * 0.1) * 5.0;
          color -= vec3(removeColor);
          
          vec3 backgroundCol = BackgroundColor(fragCoord.xy * 0.125) * pow(centralFalloff, 0.5) * pow(xDirFalloff, 0.5);
          backgroundCol += u_milkyway_bg_blue * (5.0 - milkywayShape) * pow(centralFalloff_rot, 2.0) * lowFreqNoiseForFalloff * pow(xDirFalloff, 0.75);
          
          backgroundCol += u_milkyway_bg_white * 0.95 * pow(centralFalloff, 1.5) * lowFreqNoiseForFalloff * pow(xDirFalloff, 2.0);
          
          finalColor = vec4(mix(backgroundCol, color, milkywayShape), 1.0);
      }
      
      fragColor = vec4(finalColor.rgb * u_color_tint * u_brightness, 1.0);
  }

  void main() {
      mainImage(gl_FragColor, vUv * iResolution.xy);
  }
`;
