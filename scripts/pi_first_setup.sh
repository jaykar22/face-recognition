#!/usr/bin/env bash
set -euo pipefail

# One-time Raspberry Pi software setup for this project.
# Run on Pi after cloning the repo.

PROJECT_DIR="${PROJECT_DIR:-$HOME/Web}"
SERVICE_NAME="${SERVICE_NAME:-face-backend}"
PI_USER_NAME="${PI_USER_NAME:-$USER}"

echo "[1/8] Installing system packages..."
sudo apt update
sudo apt install -y \
  python3 python3-venv python3-pip python3-dev \
  build-essential cmake pkg-config \
  libatlas-base-dev libjpeg-dev libopenblas-dev liblapack-dev \
  libhdf5-dev libssl-dev libffi-dev \
  espeak alsa-utils curl git

echo "[2/8] Entering project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "[3/8] Creating virtual environment (if missing)..."
if [[ ! -d ".venv" ]]; then
  python3 -m venv .venv
fi

echo "[4/8] Installing Python dependencies..."
source .venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "[5/8] Making deploy script executable..."
chmod +x scripts/update_on_pi.sh

echo "[6/8] Writing systemd service: $SERVICE_NAME"
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null <<EOF
[Unit]
Description=Face Recognition Backend (Flask)
After=network.target

[Service]
User=${PI_USER_NAME}
WorkingDirectory=${PROJECT_DIR}
Environment="FLASK_HOST=0.0.0.0"
Environment="FLASK_PORT=5000"
Environment="FLASK_DEBUG=false"
Environment="ENABLE_PI_TTS=true"
ExecStart=${PROJECT_DIR}/.venv/bin/python ${PROJECT_DIR}/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "[7/8] Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo "[8/8] Verifying health endpoint..."
sleep 3
curl -fsS "http://127.0.0.1:5000/health" && echo
echo "Pi first setup complete."
