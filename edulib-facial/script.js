const video = document.getElementById('video');
const statusDiv = document.getElementById('status');

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(iniciarCamera);

function iniciarCamera() {
    statusDiv.innerText = "📷 IA Carregada! Iniciando câmera...";
    navigator.mediaDevices.getUserMedia({
        video: { width: 720, height: 560 }
    })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error(err);
        statusDiv.innerText = "❌ Erro ao acessar a webcam.";
    });
}

async function carregarImagensDosAlunos() {
    const integrantes = ['renan', 'ravel']; 
    
    return Promise.all(
        integrantes.map(async label => {
            const imgUrl = `/fotos/${label}.jpg`; 
            const img = await faceapi.fetchImage(imgUrl);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            
            if (!detections) {
                console.error(`Nenhum rosto achado na foto de ${label}.jpg`);
                throw new Error(`Rosto não detectado: ${label}`);
            }
            
            return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
        })
    );
}

video.addEventListener('play', async () => {
    statusDiv.innerText = "⚙️ Processando biometria da equipe...";
    
    const rostosCadastrados = await carregarImagensDosAlunos();
    
    const faceMatcher = new faceapi.FaceMatcher(rostosCadastrados, 0.6); 
    
    statusDiv.innerText = "✅ Totem Ativo. Aguardando aluno...";

    const canvas = faceapi.createCanvasFromMedia(video);
    document.querySelector('.container').append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    let ultimoReconhecido = "";

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
        
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            
            const textoDisplay = result.label === 'unknown' ? 'Desconhecido' : result.label.toUpperCase();
            
            const drawBox = new faceapi.draw.DrawBox(box, { label: textoDisplay, boxColor: '#3b82f6' });
            drawBox.draw(canvas);

            if(result.label !== 'unknown' && result.label !== ultimoReconhecido) {
                ultimoReconhecido = result.label;
                statusDiv.innerText = `🟢 Aluno Reconhecido: ${textoDisplay}! (Ação registrada no console)`;
                
                console.log(`[CHECK-IN / CHECK-OUT] Aluno: ${textoDisplay} - Horário: ${new Date().toLocaleTimeString()}`);
                
                setTimeout(() => { ultimoReconhecido = ""; statusDiv.innerText = "✅ Totem Ativo. Aguardando aluno..."; }, 3000);
            }
        });
    }, 200);
});
