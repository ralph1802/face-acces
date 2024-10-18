// --------------------
// Selección de Elementos DOM
// --------------------
const mainVideo = document.querySelector("#mainVideo");
const modalVideo = document.querySelector("#modalVideo");
const waitingMessage = document.getElementById('waitingMessage');
const recognitionMessage = document.getElementById('recognitionMessage');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const modal = document.getElementById("registerModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementsByClassName("closeBtn")[0];

// --------------------
// Sección de Acceso a la Cámara
// --------------------
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        mainVideo.srcObject = stream;
        modalVideo.srcObject = stream;
    })
    .catch(error => {
        console.error("Error al acceder a la cámara: ", error);
    });

// --------------------
// Sección de Captura de Imagen
// --------------------
function captureImage(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

// --------------------
// Sección de Modal
// --------------------
openModalBtn.onclick = function() {
    modal.style.display = "flex";
    mainVideo.pause(); 
}

closeBtn.onclick = function() {
    modal.style.display = "none";
    mainVideo.play(); 
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        mainVideo.play();
    }
}

// --------------------
// Sección de Registro de Usuario
// --------------------
document.getElementById('takePhotoBtn').addEventListener('click', () => {
    const userId = document.getElementById('userId').value;
    const fullName = document.getElementById('fullName').value;

    if (!userId || !fullName) {
        alert("Por favor, ingresa matricula y nombre completo.");
        return;
    }

    const imageData = captureImage(modalVideo);

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            full_name: fullName,
            image_data: imageData
        }),
    })
    .then(response => response.json())
    .then(data => {
        successMessage.innerText = data.message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
            modal.style.display = 'none';
            mainVideo.play();
        }, 3000);
    })
    .catch(error => {
        console.error("Error al registrar usuario: ", error);
    });
});

// --------------------
// Sección de Mensajes
// --------------------
function hideAllMessages() {
    waitingMessage.style.display = 'none';
    recognitionMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// mensaje de espera
function showWaitingMessage() {
    hideAllMessages();
    waitingMessage.innerText = "Buscando rostro";
    waitingMessage.style.display = 'block';
}

// mensaje de reconocimiento
function showRecognitionMessage(userId) {
    hideAllMessages();
    recognitionMessage.innerText = `Asistencia registrada: ${userId}`;
    recognitionMessage.style.display = 'block';
    
    setTimeout(() => {
        recognitionMessage.style.display = 'none';
    }, 5000);
}

// mensaje de error
function showErrorMessage(errorText) {
    hideAllMessages();
    errorMessage.innerText = errorText;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// --------------------
// Sección de Detección de Cara
// --------------------
function detectFace() {
    showWaitingMessage();
    const imageData = captureImage(mainVideo);

    fetch('/detect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image_data: imageData
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return response.json();
    })
    .then(data => {
        if (data.message) {
            if (data.message.includes('Asistencia registrada:')) {
                const userId = data.message.split(': ')[1].trim();
                showRecognitionMessage(userId);
            } else if (data.message === 'Alumno no reconocido') {
                showErrorMessage('No se reconoció al usuario');
            }
        } else {
            showWaitingMessage();
        }
        setTimeout(detectFace, 1000);
    })
    .catch(error => {
        console.error("Error al detectar la cara: ", error);
        showErrorMessage('Error al detectar la cara');
        setTimeout(() => {
            detectFace();
        }, 1000);
    });
}

detectFace();
