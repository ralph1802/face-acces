#!/bin/bash

# Actualizar el sistema
sudo apt update -y && sudo apt upgrade -y

# Instalar Python, pip, Git y dependencias
sudo apt install -y python3 python3-pip git

# Clonar tu repositorio de GitHub (si no se ha hecho)
if [ ! -d "/opt/mi_app_flask" ]; then
    cd /opt
    sudo git clone https://github.com/tu_usuario/mi_app_flask.git
fi

cd /opt/mi_app_flask

# Instalar las dependencias de Python
sudo pip3 install -r requirements.txt

# Configurar Gunicorn para ejecutar Flask
sudo apt install -y gunicorn

# Mover el servicio systemd
sudo cp myapp.service /etc/systemd/system/

# Recargar y habilitar el servicio
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp

# Instalar un entorno gráfico ligero y navegador
sudo apt install -y xfce4 chromium-browser

# Configurar Chromium para que se ejecute en modo kiosko al inicio
mkdir -p ~/.config/autostart
cat <<EOF > ~/.config/autostart/mi_app.desktop
[Desktop Entry]
Type=Application
Name=Mi Aplicación
Exec=chromium-browser --kiosk http://localhost:8000
EOF

echo "Instalación completa. La aplicación se ejecutará automáticamente al inicio."
