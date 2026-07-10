# Deploying Colaby on AWS Lightsail (Containerized)

## Prerequisites
- AWS account (personal)
- SSH key pair for Lightsail

---

## Step 1: Create a Lightsail Instance

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com)
2. Click **Create instance**
3. Settings:
   - Region: closest to your team
   - Platform: **Linux/Unix**
   - Blueprint: **OS Only** → **Amazon Linux 2023**
   - Plan: **$3.50/month** (512MB) or **$5/month** (1GB — recommended)
4. Name it `colaby`
5. Create instance

---

## Step 2: Open Port 3000

1. Go to your instance → **Networking** tab
2. Under Firewall, click **Add rule**:
   - Application: Custom
   - Protocol: TCP
   - Port: 3000
3. Save

---

## Step 3: SSH into the Instance

Click the SSH terminal icon in the Lightsail dashboard, or use your local terminal:

```bash
ssh -i ~/your-key.pem ec2-user@YOUR_INSTANCE_IP
```

---

## Step 4: Install Docker

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
exit
```

SSH back in after exiting.

---

## Step 5: Clone and Deploy

```bash
# Clone the repo
git clone https://github.com/chusa10/colaby.git
cd colaby

# Create environment file
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
echo "NODE_ENV=production" >> .env

# Build and start the container
docker-compose up -d --build

# Seed the database (first time only)
docker exec colaby node config/seed.js
```

---

## Step 6: Verify

Open your browser and go to:
```
http://YOUR_INSTANCE_IP:3000
```

Log in with your credentials.

---

## Updating the App (future deploys)

SSH into the instance, then:

```bash
cd colaby
git pull
docker-compose up -d --build
```

The `colaby-data` volume persists your database across rebuilds.

---

## Optional: Custom Domain + HTTPS

### Add a Static IP
1. Lightsail → Networking → Create static IP → Attach to your instance

### Point your domain
1. Add an A record in your DNS: `colaby.yourdomain.com` → static IP

### Add HTTPS with nginx + Let's Encrypt

```bash
# Install nginx and certbot
sudo yum install -y nginx certbot python3-certbot-nginx

# Configure nginx (create /etc/nginx/conf.d/colaby.conf)
sudo tee /etc/nginx/conf.d/colaby.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name colaby.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
EOF

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Get SSL certificate
sudo certbot --nginx -d colaby.yourdomain.com
```

After this, open port 80 and 443 in Lightsail Networking (and optionally close 3000).

---

## Migrating to Company AWS (Future)

When ready to move:
1. Share this repo (or push the Docker image to company ECR)
2. The same `docker-compose.yml` runs anywhere with Docker
3. For ECS Fargate: create a task definition using the same Dockerfile
4. The database volume maps to an EFS mount in Fargate

No code changes needed — just infrastructure config.

---

## Backup

The SQLite database lives in the Docker volume. To back it up:

```bash
docker cp colaby:/app/database/colab.db ./colab-backup-$(date +%F).db
```

Schedule this with a cron job for daily backups.
