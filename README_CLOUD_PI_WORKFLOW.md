# Cloud + Raspberry Pi Update Workflow

This is the recommended flow for your face-recognition robot project.

## 1) Branch strategy

- Use `dev` for ongoing changes.
- Use `main` only for stable code that should run on Raspberry Pi.

## 2) GitHub CI

A workflow is added at `.github/workflows/ci.yml`:

- Runs on push/PR.
- Checks Python syntax.
- Runs a health-route smoke test (`/health`).

This ensures basic app correctness before deployment.

## 3) Raspberry Pi deployment

A script is added at `scripts/update_on_pi.sh`.

It does:

1. `git pull` latest code from branch.
2. Activates `.venv`.
3. Installs/updates requirements.
4. Restarts `face-backend` service.
5. Calls local health endpoint for quick verification.

## 4) Run update manually on Pi

```bash
cd /home/pi/Web
chmod +x scripts/update_on_pi.sh
./scripts/update_on_pi.sh
```

If your branch/service differs:

```bash
BRANCH=dev SERVICE_NAME=face-backend ./scripts/update_on_pi.sh
```

## 5) Auto-deploy from GitHub (added)

An auto-deploy workflow is added at `.github/workflows/deploy-pi.yml`.

It deploys only when:

- CI workflow is successful on `main`, or
- You manually trigger deployment from GitHub Actions (`workflow_dispatch`).

### Required GitHub Secrets

In GitHub repo -> Settings -> Secrets and variables -> Actions, add:

- `PI_HOST` : Raspberry Pi public IP / DNS
- `PI_USER` : SSH username (example: `pi`)
- `PI_SSH_KEY` : private key content (the key that can SSH into Pi)
- `PI_PORT` : SSH port (usually `22`)
- `PI_PROJECT_DIR` : project path on Pi (example: `/home/pi/Web`)

### First-time Pi SSH setup (one time)

On your Raspberry Pi:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Paste your GitHub Actions deploy public key into `authorized_keys`.

### What happens on deploy

GitHub Actions SSH into Pi and runs:

```bash
BRANCH=main SERVICE_NAME=face-backend ./scripts/update_on_pi.sh
```

The script now includes:

- automatic health-check retries
- automatic rollback to previous commit if health fails

## 6) One-time Pi bootstrap + preflight (added)

Use these scripts to fully prepare Pi software in one go:

- `scripts/pi_first_setup.sh` (installs packages, creates venv, writes systemd service, starts app)
- `scripts/pi_preflight_check.sh` (verifies service, TTS, and health)

Run:

```bash
cd /home/pi/Web
chmod +x scripts/pi_first_setup.sh scripts/pi_preflight_check.sh scripts/update_on_pi.sh
PROJECT_DIR=/home/pi/Web SERVICE_NAME=face-backend ./scripts/pi_first_setup.sh
./scripts/pi_preflight_check.sh
```

## 7) Safety recommendation

- Always deploy from tested `main`.
- Keep last known working commit tag.
- Rollback is now automatic if `/health` fails after deploy.
