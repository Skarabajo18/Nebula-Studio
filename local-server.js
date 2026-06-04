import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 3001;

// Variables de estado para compartir con la interfaz
let isExporting = false;
let exportPercent = 0;

http.createServer((req, res) => {
    // Configurar CORS para permitir peticiones desde la web local
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }
    
    // Endpoint para consultar progreso
    if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ isExporting, exportPercent }));
    }
    
    if (req.method === 'POST' && req.url === '/export') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                if (isExporting) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: "error", message: "Ya hay una exportación en curso." }));
                }

                fs.writeFileSync('temp-settings.json', body);
                console.log("---------------------------------------------------");
                console.log("✅ Recibida solicitud de exportación desde la Web!");
                console.log("Iniciando renderizado en background de Puppeteer...");
                
                isExporting = true;
                exportPercent = 0;
                
                // Ejecutar export-cli.js (redirigiendo stdout a nosotros para leer)
                const child = spawn('node', ['export-cli.js']);
                
                child.stdout.on('data', (data) => {
                    const text = data.toString();
                    process.stdout.write(text); // Mostrar en consola de todos modos
                    
                    // Buscar el porcentaje en el log
                    const match = text.match(/Renderizando:\s*([\d\.]+)%/);
                    if (match) {
                        exportPercent = parseFloat(match[1]);
                    }
                });

                child.stderr.on('data', (data) => {
                    process.stderr.write(data.toString());
                });

                child.on('close', (code) => {
                    console.log(`\nProceso CLI finalizado con código ${code}`);
                    exportPercent = 100;
                    setTimeout(() => { isExporting = false; }, 2000); // Mantener status 100% por 2s
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "ok", message: "Proceso de renderizado iniciado." }));
            } catch (err) {
                console.error("Error al procesar la exportación:", err);
                isExporting = false;
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "error", message: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(PORT, '127.0.0.1', () => {
    console.log(`=========================================`);
    console.log(`🔌 Puente de Exportación MP4 corriendo...`);
    console.log(`Esperando conexiones en http://127.0.0.1:${PORT}`);
    console.log(`=========================================`);
});
