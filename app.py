from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import base64
import face_recognition

app = Flask(__name__)

# Almacena las imágenes y los IDs
known_face_encodings = []
known_face_ids = []

# Directorio para almacenar imágenes
os.makedirs('stored_images', exist_ok=True)
# Archivo para registrar entradas y salidas
log_file = 'access_log.txt'

def register_user(user_id, image_path):
    image = face_recognition.load_image_file(image_path)
    encoding = face_recognition.face_encodings(image)[0]
    known_face_encodings.append(encoding)
    known_face_ids.append(user_id)

def detect_face(image_path):
    image = face_recognition.load_image_file(image_path)
    face_encodings = face_recognition.face_encodings(image)
    
    if not face_encodings:
        return None, False  # No se detectó ninguna cara
    
    # Compara las caras detectadas con las caras conocidas
    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        
        if True in matches:
            first_match_index = matches.index(True)
            user_id = known_face_ids[first_match_index]
            return user_id, True
    
    return None, False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    user_id = data['user_id']
    image_data = data['image_data']

    # Decodificar la imagen base64
    image_data = image_data.split(',')[1]  # Extraer la parte base64
    image = base64.b64decode(image_data)
    image_path = f'stored_images/{user_id}.jpg'

    # Guardar la imagen en el sistema de archivos
    with open(image_path, 'wb') as f:
        f.write(image)

    # Registrar el usuario
    register_user(user_id, image_path)
    return jsonify({'message': 'Usuario registrado correctamente.'})

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.get_json()
        image_data = data['image_data']
        
        # Decodificar la imagen base64
        image_data = image_data.split(',')[1]  # Extraer la parte base64
        image = base64.b64decode(image_data)
        image_path = 'temp_image.jpg'

        # Guardar la imagen temporalmente para la detección
        with open(image_path, 'wb') as f:
            f.write(image)

        user_id, recognized = detect_face(image_path)

        if recognized:
            # Registrar la entrada
            now = datetime.now()
            log_entry = f"{now}: {user_id} - Entrada registrada\n"
            with open(log_file, 'a') as f:
                f.write(log_entry)

            return jsonify({'message': f'Entrada registrada para el usuario: {user_id}.'})
        else:
            return jsonify({'message': 'No se reconoció al usuario.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Retorna un error JSON

if __name__ == "__main__":
    app.run(debug=True)
