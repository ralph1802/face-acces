const mainVideo = document.querySelector("#mainVideo");
const modalVideo = document.querySelector("#modalVideo");
const messageDisplay = document.getElementById('message');
const successMessage = document.getElementById('successMessage');

// Solicitar acceso a la cámara
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        mainVideo.srcObject = stream;
        modalVideo.srcObject = stream;
    })
    .catch(error => {
        console.error("Error al acceder a la cámara: ", error);
    });

// Función para capturar la imagen y convertirla en base64
function captureImage(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

// Abrir y cerrar el modal
const modal = document.getElementById("registerModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementsByClassName("closeBtn")[0];

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

// Registrar usuario
document.getElementById('takePhotoBtn').addEventListener('click', () => {
    const userId = document.getElementById('userId').value;
    const fullName = document.getElementById('fullName').value;

    if (!userId || !fullName) {
        alert("Por favor, ingresa el ID y nombre completo.");
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

// Función para mostrar mensaje de espera
function showWaitingMessage() {
    messageDisplay.innerText = "Esperando detección...";
    messageDisplay.style.display = 'block'; // Asegúrate de mostrar el mensaje
}

// Detectar cara continuamente cada segundo
function detectFace() {
    showWaitingMessage(); // Mostrar mensaje de espera al inicio
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
            messageDisplay.innerText = data.message; // Mostrar el mensaje de reconocimiento
        } else {
            messageDisplay.innerText = "Esperando detección..."; // Reestablecer mensaje de espera si no hay detección
        }
        messageDisplay.style.display = 'block'; // Asegúrate de mostrar el mensaje
        setTimeout(detectFace, 1000); // Vuelve a detectar después de 1 segundo
    })
    .catch(error => {
        console.error("Error al detectar la cara: ", error);
        messageDisplay.innerText = "Error al detectar la cara."; // Mostrar mensaje de error
        messageDisplay.style.display = 'block'; // Asegúrate de mostrar el mensaje
        setTimeout(() => {
            messageDisplay.style.display = 'none'; // Oculta el mensaje después de 3 segundos
        }, 3000);
        setTimeout(detectFace, 1000); // Intenta detectar de nuevo después de 1 segundo
    });
}

detectFace();
