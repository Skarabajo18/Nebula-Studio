# Efecto GLSL Editor y Exportador

Este proyecto es una aplicación web impulsada por [Vite](https://vitejs.dev/) y [Three.js](https://threejs.org/) que permite visualizar y editar shaders GLSL (efectos visuales) en tiempo real, y exportarlos directamente a un archivo de video `.mp4` en alta calidad.

## Características

- **Editor en Tiempo Real:** Visualización en vivo de shaders generativos.
- **Exportación de Video Automática:** Convierte el renderizado WebGL directamente a `.mp4` usando Puppeteer (modo headless) y FFmpeg.
- **Sin Dependencias de Interfaz:** Renderiza a alta resolución (1080p, 60fps por defecto) en segundo plano.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (v16+)
- NPM o Yarn (viene con Node.js)

## Instalación

1. Clona el repositorio.
2. Abre una terminal en la carpeta del proyecto.
3. Instala las dependencias:

```bash
npm install
```

## Uso

### Método 1: Todo en Uno (Recomendado para Windows)
Simplemente haz doble clic en el archivo `start.bat`. Este script se encargará de:
1. Levantar el servidor de Vite en el puerto 3000.
2. Esperar a que inicie.
3. Ejecutar el script de exportación de video en Puppeteer.

### Método 2: Manual (Dos consolas)

**Consola 1 (Servidor de la App):**
```bash
npm run dev
```
Asegúrate de que inicie en el puerto `3000` (revisa el archivo `vite.config.js`).

**Consola 2 (Script de Exportación):**
```bash
node export-cli.js
```
El script leerá el render de la web y creará el archivo `output.mp4`.

## Configuración de Exportación
Puedes cambiar la resolución, FPS, duración del video y nombre de salida modificando el objeto `CONFIG` al inicio del archivo `export-cli.js`.

```javascript
const CONFIG = {
  // Ajustes de Video
  width: 1920,              // Ancho (Full HD)
  height: 1080,             // Alto
  fps: 60,                  // Fotogramas por segundo
  durationSeconds: 10,      // Duración del video en segundos
  
  // Salida
  outputFile: 'output.mp4'  // Nombre del archivo final
};
```
