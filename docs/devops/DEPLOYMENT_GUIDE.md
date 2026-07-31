# Deployment Guide

This guide provides step-by-step instructions for deploying the Little Angels School ERP to a production environment.

## Prerequisites
- A Linux server (e.g., Ubuntu 22.04 LTS) with at least 4GB RAM and 2 vCPUs.
- Docker and Docker Compose installed.
- Domain name pointed to the server's IP address.
- Open ports 80 and 443.

## Step 1: Clone the Repository
```bash
git clone https://github.com/shubhambandhovar/LAPS.git
cd LAPS
```

## Step 2: Configure Environment Variables
Copy the sample environment file and fill in production secrets.
```bash
cp .env.example .env
nano .env
```
Ensure you set a strong `JWT_SECRET` and secure `MONGODB_URI`. See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for details.

## Step 3: Build and Start Containers
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
This command builds the Node.js API and the React Web application, then starts them via Nginx reverse proxy.

## Step 4: Verify Deployment
Check the status of the containers:
```bash
docker-compose -f docker-compose.prod.yml ps
```
Both `laps_api_prod` and `laps_web_prod` should be running. Check API health:
```bash
curl -I http://localhost/api/v1/health
```

## Step 5: Configure SSL (HTTPS)
Use Certbot to provision an SSL certificate and update the `nginx/default.conf` to serve HTTPS traffic.
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Monitoring
- **Logs**: View application logs via `docker logs -f laps_api_prod`
- **Dashboards**: You can install PM2 or Datadog agent on the host for deep metric tracing.
