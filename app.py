from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import base64
import face_recognition
import time
import json
import openpyxl

app = Flask(__name__)

# Almacena las imágenes y los IDs
known_face_encodings = []
known_face_ids = []

# Directorio para almacenar imágenes
os.makedirs('stored_images', exist_ok=True)

# Archivo para registrar entradas y salidas
log_file = 'access_log.txt'
excel_file = 'access_log.xlsx'
data_file = 'face_data.json'  # Archivo para almacenar encodings y IDs

# Crea un archivo de Excel si no existe
if not os.path.isfile(excel_file):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(['Timestamp', 'User ID', 'Status'])  # Encabezados
    wb.save(excel_file)

# Cargar encodings y IDs desde el archivo JSON
if os.path.isfile(data_file):
    try:
        with open(data_file, 'r') as f:
            data = json.load(f)
            known_face_encodings = data.get('encodings', [])
            known_face_ids = data.get('ids', [])
    except (json.JSONDecodeError, ValueError):
        print(f"Error al cargar {data_file}. El archivo puede estar dañado o vacío. Se inicializa una nueva lista.")

# ------------------------- 
# Funciones de Registro 
# ------------------------- 
def register_user(user_id, image_path):
    image = face_recognition.load_image_file(image_path)
    encoding = face_recognition.face_encodings(image)

    if len(encoding) == 0:
        return {"message": "No se detectó rostro"}, 400

    # Convertir el encoding a una lista antes de agregarlo
    known_face_encodings.append(encoding[0].tolist())
    known_face_ids.append(user_id)

    save_face_data()  # Guardar los datos después de registrarlos

    return {"message": "Usuario registrado exitosamente."}, 200

def save_face_data():
    with open(data_file, 'w') as f:
        json.dump({'encodings': known_face_encodings, 'ids': known_face_ids}, f)

# ------------------------- 
# Funciones de Detección 
# ------------------------- 
def detect_face(image_path):
    image = face_recognition.load_image_file(image_path)
    face_encodings = face_recognition.face_encodings(image)

    if not face_encodings:
        return None, False

    # Compara las caras detectadas con las caras conocidas
    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)

        if True in matches:
            first_match_index = matches.index(True)
            user_id = known_face_ids[first_match_index]
            return user_id, True

    return None, False

# ------------------------- 
# Rutas de la Aplicación 
# ------------------------- 
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video')
def video():
    return render_template('video.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    user_id = data['user_id']
    image_data = data['image_data']
    image_data = image_data.split(',')[1]
    image = base64.b64decode(image_data)
    image_path = f'stored_images/{user_id}.jpg'

    with open(image_path, 'wb') as f:
        f.write(image)

    # Llama a la función de registro de usuario y obtiene el mensaje y el código de estado
    message, status_code = register_user(user_id, image_path)
    return jsonify(message), status_code

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.get_json()
        image_data = data['image_data']

        image_data = image_data.split(',')[1]
        image = base64.b64decode(image_data)
        image_path = 'temp_image.jpg'

        with open(image_path, 'wb') as f:
            f.write(image)

        user_id, recognized = detect_face(image_path)

        now = datetime.now()
        if recognized:
            log_entry = f"{now}: {user_id} - Entrada registrada\n"
            with open(log_file, 'a') as f:
                f.write(log_entry)
            
            # Guardar en Excel
            wb = openpyxl.load_workbook(excel_file)
            ws = wb.active
            ws.append([now, user_id, 'Entrada registrada'])  # Agregar fila con datos
            wb.save(excel_file)

            time.sleep(5)  # Retraso de 5 segundos antes de devolver la respuesta
            return jsonify({'message': f'Asistencia registrada: {user_id}.'})
        else:
            time.sleep(3)  # Retraso de 3 segundos antes de devolver la respuesta
            return jsonify({'message': 'Alumno no reconocido'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)



