import puppeteer from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// ==========================================
// CONFIGURACIÓN DE EXPORTACIÓN DEFAULT
// ==========================================
const CONFIG = {
  // Ajustes del Shader
  modeValue: 2.0,           // 1.0 = Galaxia, 0.0 = Vía Láctea, 2.0 = Túnel Cósmico
  presetMode: 'tunnel',     // El modo activo ('galaxy', 'milkyway', 'tunnel')
  presetName: 'default',    // El nombre del preset ('default', 'hypernova', 'wormhole', etc.)
  
  // Ajustes de Video
  width: 1920,              // Ancho (Full HD)
  height: 1080,             // Alto
  fps: 60,                  // Fotogramas por segundo
  durationSeconds: 10,      // Duración del video. ¡CAMBIA ESTO A 3600 PARA 1 HORA!
  
  // Salida
  outputFile: 'output.mp4'  // Nombre del archivo final
};

async function main() {
  let activeConfig = { ...CONFIG };
  try {
    if (fs.existsSync('temp-settings.json')) {
      const tempConfig = JSON.parse(fs.readFileSync('temp-settings.json', 'utf8'));
      activeConfig = { ...CONFIG, ...tempConfig };
      console.log(`[+] Cargados ajustes exactos desde la UI Web!`);
    }
  } catch (err) {
    console.log(`[-] Aviso: Usando ajustes por defecto.`);
  }

  console.log(`[1] Iniciando navegador invisible (Puppeteer con aceleración GPU)...`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle', // Usar ANGLE / DirectX para asegurar compatibilidad 1:1 con la UI en Windows
      '--use-cmd-decoder=passthrough'
    ]
  });
  
  const page = await browser.newPage();
  
  // Fijar tamaño de la ventana exactamente a la resolución deseada
  await page.setViewport({ width: activeConfig.width, height: activeConfig.height, deviceScaleFactor: 1 });

  console.log(`[2] Conectando a la app (asegúrate de que "npm run dev" esté corriendo)...`);
  try {
    // Usamos 127.0.0.1 en lugar de localhost para evitar problemas de resolución IPv6 con Vite en Node.js
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  } catch (err) {
    console.error("❌ No se pudo conectar a http://127.0.0.1:3000.");
    console.error("Asegúrate de ejecutar 'npm run dev' en otra consola antes de iniciar este script.");
    process.exit(1);
  }

  console.log(`[3] Preparando el shader (Restaurando estado visual)...`);
  await page.evaluate((conf) => {
    window.headlessSetup(conf);
  }, activeConfig);

  const totalFrames = activeConfig.durationSeconds * activeConfig.fps;
  const startTime = activeConfig.startTime || 0.0;
  
  console.log(`[4] Iniciando FFmpeg... Guardando en ${activeConfig.outputFile}`);
  // Configurar proceso FFmpeg para leer PNGs por consola (stdin) y codificar a x264 (MP4)
  const ffmpegArgs = [
    '-y', // Sobrescribir si existe
    '-f', 'image2pipe', // Formato de entrada
    '-vcodec', 'png',
    '-r', `${activeConfig.fps}`, // FPS entrada
    '-i', '-', // Leer de stdin
    '-c:v', 'libx264', // Codec de video MP4
    '-preset', 'slow', // Compresión más cuidada
    '-crf', '10', // Calidad Estudio (0-51, menor es mejor, 10 es transparente)
    '-profile:v', 'high', // Perfil alto para mantener detalle de ruido y estrellas
    '-pix_fmt', 'yuv420p', // Formato de pixel compatible universalmente
    '-r', `${activeConfig.fps}`, // FPS salida
    activeConfig.outputFile
  ];

  const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
  
  // Opcional: Descomentar para depurar FFmpeg
  // ffmpegProcess.stderr.on('data', (data) => console.log(data.toString()));

  console.log(`[5] Comenzando renderizado frame a frame (${totalFrames} frames en total)...`);
  let lastLogTime = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    // Calculamos el tiempo de la animación como el tiempo inicial exacto + el tiempo transcurrido
    const time = startTime + (i / activeConfig.fps);
    
    // Forzar renderizado exacto en el navegador y extraer buffer de datos crudo
    const dataUrl = await page.evaluate((t, w, h) => {
      return window.headlessRender(t, w, h);
    }, time, activeConfig.width, activeConfig.height);
    
    // Decodificar Base64 directo de la memoria WebGL (100% Calidad Nativa)
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const screenshotBuffer = Buffer.from(base64Data, 'base64');
    
    // Enviar la imagen cruda directamente al codificador de video FFmpeg
    ffmpegProcess.stdin.write(screenshotBuffer);
    
    // Log de progreso interactivo
    if (i % Math.max(1, Math.floor(activeConfig.fps / 2)) === 0 || i === totalFrames - 1) {
      const percent = ((i + 1) / totalFrames * 100).toFixed(2);
      const elapsed = (Date.now() - lastLogTime) / 1000;
      const fpsReal = ((i + 1) / elapsed).toFixed(1);
      process.stdout.write(`\r🚀 Renderizando: ${percent}% (Frame ${i+1}/${totalFrames}) - a ${fpsReal} fps de proceso  `);
    }
  }

  console.log(`\n\n[6] Renderizado terminado. Finalizando archivo de video...`);
  
  // Cerrar el flujo le indicará a FFmpeg que el video ha concluido
  ffmpegProcess.stdin.end();
  
  // Esperar a que FFmpeg termine de empaquetar el .mp4
  await new Promise((resolve) => {
    ffmpegProcess.on('close', resolve);
  });
  
  await browser.close();
  console.log(`✅ Video guardado exitosamente como: ${activeConfig.outputFile}`);
  console.log(`⏱️ Tiempo total de proceso: ${((Date.now() - lastLogTime)/1000).toFixed(1)} segundos.`);
}

main().catch(err => {
  console.error("\n❌ Error fatal:", err);
  process.exit(1);
});
