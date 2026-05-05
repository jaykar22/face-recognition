#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/Web}"
SERVICE_NAME="${SERVICE_NAME:-face-backend}"

echo "=== Raspberry Pi Preflight Check ==="
echo "Project: $PROJECT_DIR"
echo "Service: $SERVICE_NAME"
echo

check_ok() { echo "[OK]   $1"; }
check_warn() { echo "[WARN] $1"; }
check_fail() { echo "[FAIL] $1"; }

if [[ -d "$PROJECT_DIR" ]]; then
  check_ok "Project directory exists"
else
  check_fail "Project directory missing"
  exit 1
fi

if [[ -f "$PROJECT_DIR/app.py" ]]; then
  check_ok "app.py exists"
else
  check_fail "app.py missing"
fi

if [[ -d "$PROJECT_DIR/.venv" ]]; then
  check_ok "Virtual environment exists"
else
  check_warn ".venv missing"
fi

if command -v espeak >/dev/null 2>&1; then
  check_ok "espeak installed"
else
  check_warn "espeak not installed"
fi

if systemctl list-unit-files | rg -q "^${SERVICE_NAME}\.service"; then
  check_ok "systemd service installed"
else
  check_warn "systemd service not installed"
fi

if systemctl is-active --quiet "$SERVICE_NAME"; then
  check_ok "service is running"
else
  check_warn "service not running"
fi

if curl -fsS "http://127.0.0.1:5000/health" >/dev/null 2>&1; then
  check_ok "health endpoint is reachable"
else
  check_warn "health endpoint not reachable"
fi

echo
echo "Preflight check complete."
