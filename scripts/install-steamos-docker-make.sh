#!/usr/bin/env bash
# Install Docker, Docker Compose v2, and GNU make on SteamOS so project Makefile targets work.
# Run from Desktop Mode Konsole: bash scripts/install-steamos-docker-make.sh
# Requires: sudo password (set with `passwd` if you have not yet).

set -euo pipefail

echo "Installing docker, docker-compose, and make (SteamOS / pacman)..."
echo "You will be prompted for your sudo password."
echo ""

sudo steamos-readonly disable

echo "Syncing pacman databases and fixing PGP trust (holo / SteamOS repos)..."
sudo pacman -Sy
sudo pacman-key --init
sudo pacman-key --populate archlinux
sudo pacman-key --populate holo
sudo pacman -Sy --needed holo-keyring archlinux-keyring --noconfirm

echo "Clearing possibly bad cached packages from the failed attempt..."
sudo rm -f /var/cache/pacman/pkg/docker-compose-*.pkg.tar.zst \
  /var/cache/pacman/pkg/make-*.pkg.tar.zst \
  /var/cache/pacman/pkg/docker-*.pkg.tar.zst 2>/dev/null || true

sudo pacman -Sy --needed docker docker-compose make --noconfirm

sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker "${USER}"

sudo mkdir -p /etc/docker
if [[ ! -f /etc/docker/daemon.json ]]; then
  echo '{"bridge":"none"}' | sudo tee /etc/docker/daemon.json >/dev/null
  echo "Created /etc/docker/daemon.json with bridge disabled (common fix on Steam Deck Neptune kernels)."
elif ! grep -q '"bridge"' /etc/docker/daemon.json 2>/dev/null; then
  echo "Warning: /etc/docker/daemon.json exists without a \"bridge\" key."
  echo "If Docker fails to start, add \"bridge\": \"none\" per Steam Deck Docker guides."
fi

sudo systemctl enable containerd docker
sudo systemctl restart containerd
sudo systemctl restart docker

sudo steamos-readonly enable

echo ""
echo "Verifying (may fail until you open a new shell or run: newgrp docker)..."
sudo docker --version
sudo docker compose version
make --version | head -1

echo ""
echo "Done. Log out and back in (or run: newgrp docker) so group 'docker' applies, then from the repo:"
echo "  make up"
echo "  make dev"
