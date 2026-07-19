importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

let worker = null;

async function initWorker() {
    if (!worker) {
        worker = await Tesseract.createWorker('chi_sim');
        await worker.loadLanguage('chi_sim');
        await worker.initialize('chi_sim');
    }
    return worker;
}

function compressImage(imageData, maxWidth) {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    
    let width = imageData.width;
    let height = imageData.height;
    
    if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
    }
    
    const compressedCanvas = new OffscreenCanvas(width, height);
    const compressedCtx = compressedCanvas.getContext('2d');
    compressedCtx.drawImage(canvas, 0, 0, width, height);
    
    return compressedCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
}

self.onmessage = async function(e) {
    try {
        const { type, file } = e.data;
        
        if (type === 'recognize') {
            await initWorker();
            
            const compressedFile = await compressImage(file, 1000);
            
            const { data: { text } } = await worker.recognize(compressedFile);
            
            self.postMessage({
                type: 'result',
                text: text
            });
        } else if (type === 'terminate') {
            if (worker) {
                await worker.terminate();
                worker = null;
            }
            self.postMessage({ type: 'terminated' });
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message
        });
    }
};