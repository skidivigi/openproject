# Custom OpenProject Docker deployment

This directory builds the customized OpenProject source tree as the production `slim` image and runs it with PostgreSQL, Memcached, the background worker, the mail cron process, Hocuspocus and Caddy.

The initial office address is `http://10.20.30.40:8080`. The deployment is intentionally HTTP-only until an external Nginx reverse proxy with TLS is configured.

## 1. Prepare Docker Hub

1. Create a Docker Hub account.
2. Create a **public** repository, for example `your-user/openproject-custom`.
3. Install Docker Engine plus the Compose and Buildx plugins on the build machine.
4. Log in interactively. Do not put the password or access token in a script or in this repository:

```bash
docker login -u YOUR_DOCKERHUB_USER
```

For automation, store a Docker Hub access token in the CI secret store and pass it to `docker login --password-stdin`. Never commit it.

## 2. Build and push the customized application image

Run from the OpenProject repository root:

```bash
./docker/custom-deployment/build-and-push.sh \
  YOUR_DOCKERHUB_USER/openproject-custom \
  18.0.0-custom.1
```

The default build target is `linux/amd64`, which is suitable for a typical office x86-64 server. To publish a multi-platform image:

```bash
PLATFORMS=linux/amd64,linux/arm64 \
  ./docker/custom-deployment/build-and-push.sh \
  YOUR_DOCKERHUB_USER/openproject-custom \
  18.0.0-custom.1
```

To additionally publish the mutable `latest` tag:

```bash
PUBLISH_LATEST=true \
  ./docker/custom-deployment/build-and-push.sh \
  YOUR_DOCKERHUB_USER/openproject-custom \
  18.0.0-custom.1
```

Use the versioned tag in production. The script builds `docker/prod/Dockerfile` with the official `slim` production target, embeds the compiled frontend and pushes the image directly to Docker Hub.

## 3. Create the private deployment environment

From this directory, run once after the Docker Hub repository exists:

```bash
./prepare-env.sh \
  YOUR_DOCKERHUB_USER/openproject-custom \
  18.0.0-custom.1 \
  10.20.30.40:8080
```

This creates `.env`, generates independent URL-safe secrets, and sets file permissions to `600`. The file is ignored by Git. Back it up securely; changing `SECRET_KEY_BASE` later invalidates sessions and remembered 2FA tokens.

Do not use `.env.example` directly in production. It contains placeholders only.

## 4. Copy to the office server

Copy this directory, including the private `.env`, to the server. The server only needs these files:

```text
docker-compose.yml
Caddyfile
.env
```

Ensure TCP port `8080` is allowed by the host firewall and that the server owns `10.20.30.40`.

## 5. Start tomorrow

On the office server, in this directory:

```bash
docker compose up -d
```

Compose pulls the public custom image and the supporting public images, creates persistent volumes, waits for PostgreSQL, initializes or migrates the database, seeds it, and then starts the web, worker, cron, collaboration and proxy services.

Check startup:

```bash
docker compose ps
docker compose logs --tail=200 seeder web worker
curl --fail http://10.20.30.40:8080/health_checks/default
```

Open `http://10.20.30.40:8080`. On a new installation, sign in with `admin` / `admin` and immediately set a new password.

## Data and routine operations

Persistent data is stored in the named volumes `openproject-custom_pgdata` and `openproject-custom_opdata`.

```bash
# Stop without deleting data
docker compose down

# Restart
docker compose restart

# Follow logs
docker compose logs -f --tail=200

# Pull a newly published tag and recreate services
docker compose pull
docker compose up -d
```

Never run `docker compose down -v` unless the database and attachments must be permanently deleted.

## Switching to Nginx with TLS later

After Nginx and a certificate are ready, update `.env`:

```dotenv
OPENPROJECT_HOST__NAME=openproject.company.example
OPENPROJECT_HTTPS=true
OPENPROJECT_HSTS=true
COLLABORATIVE_SERVER_URL=wss://openproject.company.example/hocuspocus
BIND_ADDRESS=127.0.0.1
```

Nginx must proxy both normal HTTP requests and WebSocket upgrades for `/hocuspocus`. Then apply the settings with:

```bash
docker compose up -d
```
