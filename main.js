import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shader.js';
import { createIcons, Orbit, Sliders, Wand2, Settings, Sparkles, Aperture, Waves, Download, Play, Pause, Square, Video } from 'lucide';

// Elements
const canvas = document.getElementById('canvas-preview');
const container = document.getElementById('canvas-container');

// Timeline Elements
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const timelineRange = document.getElementById('timeline-range');
const timeDisplay = document.getElementById('time-display');
const fpsDisplay = document.getElementById('fps-counter');

// Mode Switch Elements
const modeSelect = document.getElementById('mode-select');
const galaxyControls = document.getElementById('galaxy-controls');
const milkywayControls = document.getElementById('milkyway-controls');

// Toast & Progress Elements
const toast = document.getElementById('toast');
const progressModal = document.getElementById('progress-modal');
const progressBar = document.getElementById('progress-bar-fill');
const progressPercent = document.getElementById('progress-percent');
const btnCancelRecord = document.getElementById('btn-cancel-record');

// Export Form Elements
const btnRecord = document.getElementById('btn-record');
const btnRecordMp4 = document.getElementById('btn-record-mp4');
const recDurationInput = document.getElementById('rec-duration');
const recWidthSelect = document.getElementById('rec-width');
const recHeightSelect = document.getElementById('rec-height');
const recFpsSelect = document.getElementById('rec-fps');
const recBitrateSelect = document.getElementById('rec-bitrate');

// State
let isPlaying = true;
let iTime = 0;
let lastTime = 0;
let clock = new THREE.Clock();
let isRecordingState = false;
let recordedChunks = [];
let mediaRecorder = null;
let currentFrameIndex = 0;
let totalFramesToRecord = 0;
let fpsInterval = 0;
let lastFpsUpdate = 0;
let framesThisSecond = 0;

// Presets database
const presets = {
  galaxy: {
    default: {
      u_galaxy_swirl: 2.5,
      u_galaxy_swirl_speed: 0.225,
      u_galaxy_max_intensity: 1.65,
      u_galaxy_light_intensity: 4.0,
      u_galaxy_col1: '#c0804d',
      u_galaxy_col2: '#8c66f2',
      u_star_density: 0.5,
      u_star_brightness: 6.0,
      u_star_speed: 1.0,
      u_speed: 1.0,
      u_brightness: 1.0,
      u_color_tint: '#ffffff'
    },
    hypernova: {
      u_galaxy_swirl: 4.5,
      u_galaxy_swirl_speed: 0.5,
      u_galaxy_max_intensity: 1.3,
      u_galaxy_light_intensity: 7.5,
      u_galaxy_col1: '#ff2200',
      u_galaxy_col2: '#ffcc00',
      u_star_density: 0.7,
      u_star_brightness: 8.5,
      u_star_speed: 1.8,
      u_speed: 1.5,
      u_brightness: 1.1,
      u_color_tint: '#ffe6e6'
    },
    blackhole: {
      u_galaxy_swirl: 7.0,
      u_galaxy_swirl_speed: 0.08,
      u_galaxy_max_intensity: 2.2,
      u_galaxy_light_intensity: 2.0,
      u_galaxy_col1: '#1a0033',
      u_galaxy_col2: '#4d0099',
      u_star_density: 0.3,
      u_star_brightness: 3.0,
      u_star_speed: 0.4,
      u_speed: 0.5,
      u_brightness: 0.8,
      u_color_tint: '#d9b3ff'
    },
    aquanebula: {
      u_galaxy_swirl: 2.0,
      u_galaxy_swirl_speed: 0.15,
      u_galaxy_max_intensity: 1.8,
      u_galaxy_light_intensity: 5.0,
      u_galaxy_col1: '#00ffcc',
      u_galaxy_col2: '#0066ff',
      u_star_density: 0.6,
      u_star_brightness: 7.0,
      u_star_speed: 0.8,
      u_speed: 0.8,
      u_brightness: 1.0,
      u_color_tint: '#e6ffff'
    }
  },
  milkyway: {
    default: {
      u_milkyway_swirl: 0.25,
      u_milkyway_speed: 1.0,
      u_milkyway_offset: 0.0,
      u_milkyway_bg_blue: '#333366',
      u_milkyway_bg_white: '#80ffd9',
      u_milkyway_palette_a: '#808080',
      u_milkyway_palette_b: '#e1a7cc', // maps closely to [-1.08, 0.65, -0.2] normalized
      u_milkyway_palette_c: '#cbe751', // maps closely to [0.798, 0.908, 0.318]
      u_milkyway_palette_d: '#004400',
      u_star_density: 0.5,
      u_star_brightness: 6.0,
      u_star_speed: 1.0,
      u_speed: 1.0,
      u_brightness: 1.0,
      u_color_tint: '#ffffff'
    },
    cosmicfire: {
      u_milkyway_swirl: 0.45,
      u_milkyway_speed: 1.4,
      u_milkyway_offset: 0.1,
      u_milkyway_bg_blue: '#4d0000',
      u_milkyway_bg_white: '#ff9900',
      u_milkyway_palette_a: '#808080',
      u_milkyway_palette_b: '#808080',
      u_milkyway_palette_c: '#ffffff',
      u_milkyway_palette_d: '#0054ab',
      u_star_density: 0.6,
      u_star_brightness: 8.0,
      u_star_speed: 1.3,
      u_speed: 1.2,
      u_brightness: 1.15,
      u_color_tint: '#ffeedd'
    },
    deeppurple: {
      u_milkyway_swirl: 0.3,
      u_milkyway_speed: 0.7,
      u_milkyway_offset: 0.05,
      u_milkyway_bg_blue: '#1a0033',
      u_milkyway_bg_white: '#b366ff',
      u_milkyway_palette_a: '#cc8066',
      u_milkyway_palette_b: '#336633',
      u_milkyway_palette_c: '#ffffaa',
      u_milkyway_palette_d: '#004040',
      u_star_density: 0.4,
      u_star_brightness: 5.0,
      u_star_speed: 0.8,
      u_speed: 0.8,
      u_brightness: 0.95,
      u_color_tint: '#f3e6ff'
    },
    emeraldaurora: {
      u_milkyway_swirl: 0.2,
      u_milkyway_speed: 1.2,
      u_milkyway_offset: -0.05,
      u_milkyway_bg_blue: '#00331a',
      u_milkyway_bg_white: '#66ffb3',
      u_milkyway_palette_a: '#808080',
      u_milkyway_palette_b: '#808080',
      u_milkyway_palette_c: '#ffff80',
      u_milkyway_palette_d: '#ccd64d',
      u_star_density: 0.55,
      u_star_brightness: 7.0,
      u_star_speed: 1.1,
      u_speed: 1.1,
      u_brightness: 1.0,
      u_color_tint: '#e6ffe6'
    }
  },
  tunnel: {
    default: {
      u_tunnel_cam_shake: 1.0,
      u_tunnel_width: 4.0,
      u_tunnel_distortion: 0.3,
      u_tunnel_orb_size: 0.1,
      u_tunnel_color_cycle: 0.1,
      u_tunnel_glow: 6.0,
      u_tunnel_color_picker: '#b33c00',
      u_speed: 1.0,
      u_brightness: 1.0,
      u_color_tint: '#ffffff'
    },
    wormhole: {
      u_tunnel_cam_shake: 2.0,
      u_tunnel_width: 3.0,
      u_tunnel_distortion: 0.6,
      u_tunnel_orb_size: 0.05,
      u_tunnel_color_cycle: 0.25,
      u_tunnel_glow: 4.0,
      u_tunnel_color_picker: '#3366ff',
      u_speed: 1.2,
      u_brightness: 1.1,
      u_color_tint: '#e6ffff'
    },
    nebulapass: {
      u_tunnel_cam_shake: 0.4,
      u_tunnel_width: 6.0,
      u_tunnel_distortion: 0.15,
      u_tunnel_orb_size: 0.4,
      u_tunnel_color_cycle: 0.05,
      u_tunnel_glow: 8.0,
      u_tunnel_color_picker: '#ff3300',
      u_speed: 0.6,
      u_brightness: 1.0,
      u_color_tint: '#ffe6e6'
    },
    cybertunnel: {
      u_tunnel_cam_shake: 0.0,
      u_tunnel_width: 2.5,
      u_tunnel_distortion: 0.8,
      u_tunnel_orb_size: 0.0,
      u_tunnel_color_cycle: 0.4,
      u_tunnel_glow: 3.0,
      u_tunnel_color_picker: '#00ff66',
      u_speed: 1.5,
      u_brightness: 1.2,
      u_color_tint: '#e6ffee'
    },
    skarabajo: {
      u_tunnel_cam_shake: 1.0,
      u_tunnel_width: 4.0,
      u_tunnel_distortion: 0.3,
      u_tunnel_orb_size: 0.1,
      u_tunnel_color_cycle: 0.1,
      u_tunnel_glow: 6.0,
      u_tunnel_color_picker: '#1a0033',
      u_speed: 1.0,
      u_brightness: 1.0,
      u_color_tint: '#ffffff'
    }
  }
};

// 256x256 procedural noise texture for iChannel0 (emulates Shadertoy noise)
function generateNoiseTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  // Deterministic pseudo-random seed to keep noise consistent
  let seed = 123456789;
  function random() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 0; i < size * size; i++) {
    const val = Math.floor(random() * 256);
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Three.js Graphics Setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  antialias: false, 
  preserveDrawingBuffer: true,
  alpha: false // FUNDAMENTAL: Evitar transparencias que arruinan la compresión MP4 y queman el color
});
renderer.setClearColor(0x000000, 1.0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Shader Uniforms definition
const uniforms = {
  iResolution: { value: new THREE.Vector2() },
  iTime: { value: 0 },
  iChannel0: { value: generateNoiseTexture() },
  
  u_mode: { value: 1.0 }, // 1.0 = Galaxy, 0.0 = Milky Way
  u_speed: { value: 1.0 },
  u_brightness: { value: 1.0 },
  u_color_tint: { value: new THREE.Color(1, 1, 1) },
  
  u_star_density: { value: 0.5 },
  u_star_brightness: { value: 6.0 },
  u_star_speed: { value: 1.0 },
  
  u_galaxy_swirl: { value: 2.5 },
  u_galaxy_swirl_speed: { value: 0.225 },
  u_galaxy_max_intensity: { value: 1.65 },
  u_galaxy_light_intensity: { value: 4.0 },
  u_galaxy_col1: { value: new THREE.Color() },
  u_galaxy_col2: { value: new THREE.Color() },
  
  u_milkyway_offset: { value: 0.0 },
  u_milkyway_swirl: { value: 0.25 },
  u_milkyway_speed: { value: 1.0 },
  u_milkyway_palette_a: { value: new THREE.Color() },
  u_milkyway_palette_b: { value: new THREE.Color() },
  u_milkyway_palette_c: { value: new THREE.Color() },
  u_milkyway_palette_d: { value: new THREE.Color() },
  u_milkyway_bg_blue: { value: new THREE.Color() },
  u_milkyway_bg_white: { value: new THREE.Color() },

  u_tunnel_cam_shake: { value: 1.0 },
  u_tunnel_width: { value: 4.0 },
  u_tunnel_distortion: { value: 0.3 },
  u_tunnel_orb_size: { value: 0.1 },
  u_tunnel_color_cycle: { value: 0.1 },
  u_tunnel_color_vec: { value: new THREE.Color() },
  u_tunnel_glow: { value: 6.0 },
  u_tunnel_show_star: { value: 1.0 },
  u_loop_duration: { value: 5.0 }
};

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  depthWrite: false,
  depthTest: false
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Handle screen resizing
// Handle screen resizing with Letterbox locking for Video Aspect Ratio
function resizeCanvas() {
  if (isRecordingState) return; // Ignore window resize when exporting
  
  const recWidth = parseInt(document.getElementById('rec-width').value) || 1280;
  const recHeight = parseInt(document.getElementById('rec-height').value) || 720;
  const exportAspect = recWidth / recHeight;
  
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const containerAspect = containerWidth / containerHeight;
  
  let targetWidth = containerWidth;
  let targetHeight = containerHeight;
  
  if (containerAspect > exportAspect) {
    // Si el contenedor es más ancho que el formato (ej. monitor ultra-wide vs 16:9), limitar ancho
    targetWidth = containerHeight * exportAspect;
  } else {
    // Si el contenedor es más alto, limitar alto
    targetHeight = containerWidth / exportAspect;
  }
  
  // Limitar el Canvas para obligar a mostrar la vista EXACTA del video
  canvas.style.width = targetWidth + 'px';
  canvas.style.height = targetHeight + 'px';
  
  // Centrar el Canvas como si fueran barras de cine
  canvas.style.marginTop = ((containerHeight - targetHeight) / 2) + 'px';
  canvas.style.marginLeft = ((containerWidth - targetWidth) / 2) + 'px';
  
  // Renderizar INTERNAMENTE al tamaño exacto de exportación (esto evita que el Raymarching diverja al exportar en resoluciones mayores)
  renderer.setPixelRatio(1);
  renderer.setSize(recWidth, recHeight, false);
  uniforms.iResolution.value.set(recWidth, recHeight);
}
window.addEventListener('resize', resizeCanvas);
document.getElementById('rec-width').addEventListener('change', resizeCanvas);
document.getElementById('rec-height').addEventListener('change', resizeCanvas);
resizeCanvas();

// Map UI Inputs to Uniforms
function hexToRgbColor(hex, targetColor) {
  targetColor.set(hex);
  return targetColor;
}

// Special mapping helper for Milky Way custom palette parameters (b, c, d can have negative bounds)
// We decode the hex color values to create scaled vector coordinates
function hexToPaletteVector(hex, targetColor, minVal = -2.0, maxVal = 2.0) {
  const c = new THREE.Color(hex);
  // Map 0..1 RGB ranges to custom minVal..maxVal ranges
  targetColor.r = minVal + c.r * (maxVal - minVal);
  targetColor.g = minVal + c.g * (maxVal - minVal);
  targetColor.b = minVal + c.b * (maxVal - minVal);
  return targetColor;
}

function updateUniformsFromUI() {
  const mode = parseFloat(modeSelect.value);
  uniforms.u_mode.value = mode;

  const tunnelControls = document.getElementById('tunnel-controls');

  // Show/Hide section controls
  if (mode === 1.0) {
    galaxyControls.style.display = 'block';
    milkywayControls.style.display = 'none';
    if (tunnelControls) tunnelControls.style.display = 'none';
  } else if (mode === 0.0) {
    galaxyControls.style.display = 'none';
    milkywayControls.style.display = 'block';
    if (tunnelControls) tunnelControls.style.display = 'none';
  } else {
    galaxyControls.style.display = 'none';
    milkywayControls.style.display = 'none';
    if (tunnelControls) tunnelControls.style.display = 'block';
  }

  // General controls
  uniforms.u_speed.value = parseFloat(document.getElementById('input-speed').value);
  uniforms.u_brightness.value = parseFloat(document.getElementById('input-brightness').value);
  hexToRgbColor(document.getElementById('input-tint').value, uniforms.u_color_tint.value);

  // Stars controls
  uniforms.u_star_density.value = parseFloat(document.getElementById('input-star-density').value);
  uniforms.u_star_brightness.value = parseFloat(document.getElementById('input-star-brightness').value);
  uniforms.u_star_speed.value = parseFloat(document.getElementById('input-star-speed').value);

  // Galaxy controls
  uniforms.u_galaxy_swirl.value = parseFloat(document.getElementById('input-galaxy-swirl').value);
  uniforms.u_galaxy_swirl_speed.value = parseFloat(document.getElementById('input-galaxy-swirl-speed').value);
  uniforms.u_galaxy_max_intensity.value = parseFloat(document.getElementById('input-galaxy-radius').value);
  uniforms.u_galaxy_light_intensity.value = parseFloat(document.getElementById('input-galaxy-light').value);
  hexToRgbColor(document.getElementById('input-galaxy-col1').value, uniforms.u_galaxy_col1.value);
  hexToRgbColor(document.getElementById('input-galaxy-col2').value, uniforms.u_galaxy_col2.value);

  // Milky Way controls
  uniforms.u_milkyway_offset.value = parseFloat(document.getElementById('input-milkyway-offset').value);
  uniforms.u_milkyway_swirl.value = parseFloat(document.getElementById('input-milkyway-swirl').value);
  uniforms.u_milkyway_speed.value = parseFloat(document.getElementById('input-milkyway-speed').value);
  hexToRgbColor(document.getElementById('input-milkyway-bg-blue').value, uniforms.u_milkyway_bg_blue.value);
  hexToRgbColor(document.getElementById('input-milkyway-bg-white').value, uniforms.u_milkyway_bg_white.value);

  // Milky Way Palettes
  hexToRgbColor(document.getElementById('input-palette-a').value, uniforms.u_milkyway_palette_a.value);
  hexToPaletteVector(document.getElementById('input-palette-b').value, uniforms.u_milkyway_palette_b.value, -2.0, 1.5);
  hexToPaletteVector(document.getElementById('input-palette-c').value, uniforms.u_milkyway_palette_c.value, 0.0, 2.5);
  hexToPaletteVector(document.getElementById('input-palette-d').value, uniforms.u_milkyway_palette_d.value, -0.5, 0.5);

  // Cosmic Tunnel controls
  if (tunnelControls) {
    uniforms.u_tunnel_cam_shake.value = parseFloat(document.getElementById('input-tunnel-cam-shake').value);
    uniforms.u_tunnel_width.value = parseFloat(document.getElementById('input-tunnel-width').value);
    uniforms.u_tunnel_distortion.value = parseFloat(document.getElementById('input-tunnel-distortion').value);
    uniforms.u_tunnel_orb_size.value = parseFloat(document.getElementById('input-tunnel-orb-size').value);
    uniforms.u_tunnel_show_star.value = document.getElementById('input-tunnel-show-star').checked ? 1.0 : 0.0;
    uniforms.u_tunnel_color_cycle.value = parseFloat(document.getElementById('input-tunnel-color-cycle').value);
    uniforms.u_tunnel_glow.value = parseFloat(document.getElementById('input-tunnel-glow').value);
    
    const inputLoop = document.getElementById('input-loop-duration');
    if (inputLoop) uniforms.u_loop_duration.value = parseFloat(inputLoop.value);

    const tunnelColor = new THREE.Color(document.getElementById('input-tunnel-color-picker').value);
    uniforms.u_tunnel_color_vec.value.setRGB(
      tunnelColor.r * 5.0,
      tunnelColor.g * 5.0,
      tunnelColor.b * 5.0
    );
  }
}

// Wire up inputs
const allInputs = document.querySelectorAll('.setting-input');
allInputs.forEach(input => {
  input.addEventListener('input', () => {
    updateUniformsFromUI();
    // Update value badge next to slider if it exists
    const badge = input.parentElement.querySelector('.value-badge');
    if (badge) {
      badge.textContent = input.value;
    }
  });
});

modeSelect.addEventListener('change', updateUniformsFromUI);

// Preset selector handler
function applyPreset(mode, name) {
  const presetData = presets[mode]?.[name];
  if (!presetData) return;

  Object.entries(presetData).forEach(([key, val]) => {
    const elementId = key.replace('u_', 'input-').replace(/_/g, '-');
    const element = document.getElementById(elementId);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = val > 0.5;
      } else {
        element.value = val;
        const badge = element.parentElement.querySelector('.value-badge');
        if (badge) badge.textContent = val;
      }
    }
  });

  updateUniformsFromUI();
  showToast(`Ajuste aplicado: ${name.toUpperCase()}`);
}

// Attach preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from neighbors
    btn.parentElement.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const mode = btn.dataset.mode;
    const presetName = btn.dataset.preset;
    applyPreset(mode, presetName);
  });
});

// Toast Helper
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Playback Logic
btnPlay.addEventListener('click', () => {
  isPlaying = true;
  clock.start();
  btnPlay.classList.add('active');
  btnPause.classList.remove('active');
});

btnPause.addEventListener('click', () => {
  isPlaying = false;
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
});

btnStop.addEventListener('click', () => {
  isPlaying = false;
  iTime = 0;
  uniforms.iTime.value = 0;
  timelineRange.value = 0;
  timeDisplay.textContent = '0.00s';
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
  renderer.render(scene, camera);
});

// Timeline scrub
timelineRange.addEventListener('input', () => {
  isPlaying = false;
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
  
  iTime = parseFloat(timelineRange.value);
  uniforms.iTime.value = iTime;
  timeDisplay.textContent = iTime.toFixed(2) + 's';
  renderer.render(scene, camera);
});

// Render Animation Loop
function animate(now) {
  requestAnimationFrame(animate);

  if (isRecordingState) return; // Let recording loop control rendering during export

  if (isPlaying) {
    const delta = clock.getDelta();
    iTime += delta;
    uniforms.iTime.value = iTime;
    
    // Update timeline visual position (loop at 30 seconds for scrub convenience)
    timelineRange.value = (iTime % 30).toFixed(2);
    timeDisplay.textContent = iTime.toFixed(2) + 's';
  }

  // Calculate FPS
  framesThisSecond++;
  if (now - lastFpsUpdate > 1000) {
    fpsDisplay.textContent = `FPS: ${framesThisSecond}`;
    framesThisSecond = 0;
    lastFpsUpdate = now;
  }

  renderer.render(scene, camera);
}

// Video Recording & Export Mechanism
function showProgressModal() {
  progressModal.classList.add('show');
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
}

function updateProgress(percent) {
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
}

function hideProgressModal() {
  progressModal.classList.remove('show');
}

async function startOfflineRecording() {
  if (isRecordingState) return;
  
  isPlaying = false;
  isRecordingState = true;
  recordedChunks = [];
  
  const recDuration = parseFloat(recDurationInput.value) || 5;
  const recWidth = parseInt(recWidthSelect.value) || 1280;
  const recHeight = parseInt(recHeightSelect.value) || 720;
  const recFps = parseInt(recFpsSelect.value) || 30;
  const recBitrate = parseInt(recBitrateSelect.value) || 30000000;

  // Save screen settings to restore later
  const originalWidth = container.clientWidth;
  const originalHeight = container.clientHeight;
  const originalPixelRatio = renderer.getPixelRatio();

  // Set recorder canvas size exactly 1:1, avoiding internal scaling blur
  renderer.setPixelRatio(1);
  renderer.setSize(recWidth, recHeight, false);
  canvas.width = recWidth;
  canvas.height = recHeight;
  uniforms.iResolution.value.set(recWidth, recHeight);

  // Set up MediaRecorder
  const stream = canvas.captureStream(recFps);
  
  // Choose supported format with custom bitrate (videoBitsPerSecond)
  let options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: recBitrate };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: recBitrate };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm', videoBitsPerSecond: recBitrate };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: '', videoBitsPerSecond: recBitrate }; // Fallback to browser default
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (err) {
    showToast("Error inicializando grabador de video.");
    isRecordingState = false;
    resizeCanvas();
    return;
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    const modeName = modeSelect.value === '1.0' ? 'galaxy' : 'milkyway';
    a.download = `${modeName}-effect-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    isRecordingState = false;
    
    // Reset Canvas to screen size and restore pixel ratio
    renderer.setPixelRatio(originalPixelRatio);
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    resizeCanvas();
    hideProgressModal();
    showToast("¡Video exportado exitosamente!");
    clock.start();
    isPlaying = true;
  };

  // Start recorder
  mediaRecorder.start();
  showProgressModal();

  currentFrameIndex = 0;
  totalFramesToRecord = recDuration * recFps;

  // MediaRecorder relies on real-time capturing from the stream.
  // We must pace our rendering to match the requested framerate exactly.
  const msPerFrame = 1000 / recFps;
  let expectedNextFrameTime = performance.now();

  function recordNextFrame() {
    if (!isRecordingState) return;

    if (currentFrameIndex >= totalFramesToRecord) {
      // Small delay to ensure the last frame is fully captured by the stream
      setTimeout(() => mediaRecorder.stop(), 100);
      return;
    }

    const now = performance.now();
    // Wait until it's time for the next frame
    if (now < expectedNextFrameTime) {
      requestAnimationFrame(recordNextFrame);
      return;
    }

    // Advance our target time (do not accumulate delays)
    expectedNextFrameTime += msPerFrame;
    // If we're lagging too much, reset expectations to prevent a massive catch-up burst
    if (now > expectedNextFrameTime + msPerFrame * 2) {
      expectedNextFrameTime = now;
    }

    // Set fixed time index for perfect render simulation
    const frameTime = currentFrameIndex / recFps;
    uniforms.iTime.value = frameTime;
    
    // Render the frame onto canvas
    renderer.render(scene, camera);

    // Update progress bar
    const progressVal = Math.round((currentFrameIndex / totalFramesToRecord) * 100);
    updateProgress(progressVal);

    currentFrameIndex++;
    
    // Continue loop
    requestAnimationFrame(recordNextFrame);
  }

  // Start rendering process
  requestAnimationFrame(recordNextFrame);
}

btnRecord.addEventListener('click', startOfflineRecording);

btnRecordMp4.addEventListener('click', async () => {
  // Recolectar configuración actual
  const exportConfig = {
    modeValue: modeSelect.value, // Mantener como string ('1.0', '0.0', '2.0')
    width: parseInt(recWidthSelect.value) || 1280,
    height: parseInt(recHeightSelect.value) || 720,
    fps: parseInt(recFpsSelect.value) || 30,
    durationSeconds: parseFloat(recDurationInput.value) || 5,
    outputFile: 'output.mp4',
    startTime: (modeSelect.value === '3.0' || modeSelect.value === '4.0' || modeSelect.value === '5.0') ? 0.0 : iTime, // Guardar el tiempo actual (forzar 0 en bucle)
    uiState: {}
  };

  // Guardar estado visual exacto
  document.querySelectorAll('.setting-input').forEach(input => {
    if (input.id) {
      if (input.type === 'checkbox') exportConfig.uiState[input.id] = input.checked;
      else exportConfig.uiState[input.id] = input.value;
    }
  });

  try {
    showToast("Enviando ajustes al renderizador MP4...");
    const response = await fetch('http://127.0.0.1:3001/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportConfig)
    });
    
    const result = await response.json();
    if (result.status === 'ok') {
      showToast("¡Renderizado MP4 iniciado!");
      
      // Mostrar la barra de progreso
      showProgressModal();
      document.querySelector('#progress-modal p').textContent = "Renderizando MP4 nativo de alta calidad en consola...";
      btnCancelRecord.style.display = 'none'; // No se puede cancelar desde UI
      
      // Iniciar el polling HTTP para leer el porcentaje del servidor
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch('http://127.0.0.1:3001/status');
          const statusData = await res.json();
          
          if (statusData.isExporting) {
            updateProgress(statusData.exportPercent);
          } else if (!statusData.isExporting && statusData.exportPercent === 100) {
            // ¡Completado!
            updateProgress(100);
            clearInterval(pollInterval);
            setTimeout(() => {
              hideProgressModal();
              showToast("¡Video MP4 Listo en tu escritorio!");
              btnCancelRecord.style.display = 'inline-block'; // Restaurar botón
            }, 1000);
          }
        } catch (e) {
          // Si el servidor se apaga o falla, detener polling
          clearInterval(pollInterval);
          hideProgressModal();
          btnCancelRecord.style.display = 'inline-block';
        }
      }, 1000);
      
    } else {
      showToast("Error: " + result.message);
    }
  } catch (err) {
    showToast("Error de conexión. ¿Está el start.bat corriendo?");
  }
});

btnCancelRecord.addEventListener('click', () => {
  if (isRecordingState) {
    isRecordingState = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    hideProgressModal();
    showToast("Exportación cancelada.");
  }
});

// Setup Init Values
updateUniformsFromUI();
applyPreset('galaxy', 'default');
createIcons({
  icons: {
    Orbit,
    Sliders,
    Wand2,
    Settings,
    Sparkles,
    Aperture,
    Waves,
    Download,
    Play,
    Pause,
    Square,
    Video
  }
});
clock.start();
requestAnimationFrame(animate);

// ==========================================
// EXPOSED API FOR HEADLESS NODE.JS RENDERING
// ==========================================
window.headlessSetup = function(configObj) {
  isPlaying = false;
  isRecordingState = true; // Stops normal render loops and resizes
  
  if (configObj && configObj.uiState) {
    // Nueva versión: Restaurar estado exacto desde JSON
    modeSelect.value = configObj.modeValue;
    Object.entries(configObj.uiState).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) {
        if (el.type === 'checkbox') el.checked = val;
        else el.value = val;
      }
    });
    updateUniformsFromUI();
  } else if (arguments.length === 3) {
    // Versión antigua (Legacy fallback)
    const modeVal = arguments[0];
    const presetMode = arguments[1];
    const presetName = arguments[2];
    
    if (modeVal !== undefined) modeSelect.value = modeVal;
    if (presetMode && presetName) {
      applyPreset(presetMode, presetName);
    } else {
      updateUniformsFromUI();
    }
  }
  
  // Hide UI to ensure pure canvas rendering if taking full screenshots
  const uiElements = document.querySelectorAll('.sidebar, .timeline-bar, .app-header');
  uiElements.forEach(el => el.style.display = 'none');
  document.querySelector('.workspace').style.padding = '0';
};

window.headlessRender = function(time, width, height) {
  // Ensure pixel ratio is 1 for maximum sharpness
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  canvas.width = width;
  canvas.height = height;
  uniforms.iResolution.value.set(width, height);
  
  // Set specific time
  uniforms.iTime.value = time;
  
  // Render exact frame synchronously
  renderer.render(scene, camera);
  
  // Retornar los datos RAW 100% calidad del buffer WebGL
  return canvas.toDataURL('image/png');
};
