# Run This Project on Raspberry Pi 4B

This guide helps you run the existing Flask + face recognition backend on Raspberry Pi OS (64-bit recommended).

## 1) Prepare Raspberry Pi

Use Raspberry Pi OS Bookworm (64-bit), then update packages:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

After reboot:

```bash
sudo apt update
sudo apt install -y \
  python3 python3-venv python3-pip python3-dev \
  build-essential cmake pkg-config \
  libatlas-base-dev libjpeg-dev libopenblas-dev liblapack-dev \
  libhdf5-dev libssl-dev libffi-dev \
  espeak alsa-utils
```

## 2) Copy project to Pi

Clone or copy this project folder to your Pi, then enter the folder:

```bash
cd /path/to/Web
```

## 3) Create virtual environment and install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

If `face-recognition` fails to build on your Pi, install `dlib` first and retry:

```bash
pip install dlib
pip install face-recognition
```

## 4) Run backend on network

The app is already configured to read host/port/debug from environment variables.

```bash
export FLASK_HOST=0.0.0.0
export FLASK_PORT=5000
export FLASK_DEBUG=false
export ENABLE_PI_TTS=true
python app.py
```

From another device on same network, open:

- `http://<RASPBERRY_PI_IP>:5000/`
- `http://<RASPBERRY_PI_IP>:5000/health`

Find Pi IP:

```bash
hostname -I
```

## 5) Optional: Run as a systemd service (auto-start on boot)

Create service file:

```bash
sudo nano /etc/systemd/system/face-backend.service
```

Paste and adjust paths/user:

```ini
[Unit]
Description=Face Recognition Backend (Flask)
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/Web
Environment="FLASK_HOST=0.0.0.0"
Environment="FLASK_PORT=5000"
Environment="FLASK_DEBUG=false"
Environment="ENABLE_PI_TTS=true"
ExecStart=/home/pi/Web/.venv/bin/python /home/pi/Web/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable face-backend
sudo systemctl start face-backend
sudo systemctl status face-backend
```

View logs:

```bash
journalctl -u face-backend -f
```

## 6) Notes specific to Pi 4B

- For better recognition speed, use clear photos and avoid very high-resolution frames.
- Keep at least 2GB free RAM; 4GB or 8GB Pi models are more comfortable for `dlib`.
- Use Raspberry Pi OS 64-bit for better compatibility with Python scientific packages.
- Run `speaker-test -c2` once to verify speaker output before testing greeting voice.
