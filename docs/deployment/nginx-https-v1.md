# Ubuntu Nginx + HTTPS V1

更新时间：2026-03-07

这份文档建立在单机 Docker 部署已经完成的前提上，目标是把：
- `http://<服务器IP>:3000`

升级为：
- `https://your-domain.com`

本文档默认：
- 服务器系统为 Ubuntu 22.04 / 24.04
- 应用已经按 `docs/deployment/deployment-v1.md` 跑在本机 `127.0.0.1:3000` 或 `0.0.0.0:3000`
- 你已经拥有一个可解析到该服务器公网 IP 的域名

## 1. 推荐的最终结构

- `Nginx` 监听 `80/443`
- `Nginx` 反向代理到本机 `127.0.0.1:3000`
- `Certbot` 申请和续期 Let's Encrypt 证书
- Docker 仍负责应用、数据库、worker

## 2. 前提检查

先确认这三件事：

1. 域名已经解析到服务器公网 IP
2. 应用已在本机成功运行
3. 云安全组已放行：
   - `80/tcp`
   - `443/tcp`

可先在服务器上检查：

```bash
curl http://127.0.0.1:3000/api/public/categories
```

如果这里都不通，不要先做 Nginx，先回到：
- `docs/deployment/deployment-v1.md`

## 3. 安装 Nginx 和 Certbot

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

验证 Nginx：

```bash
sudo systemctl status nginx
```

如果未启动：

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 4. 配置 Nginx 反向代理

假设你的域名是 `your-domain.com`。

创建站点配置：

```bash
sudo vim /etc/nginx/sites-available/nail-booking
```

写入：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/nail-booking /etc/nginx/sites-enabled/nail-booking
```

可选：删除默认站点，避免冲突。

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

测试配置：

```bash
sudo nginx -t
```

重载：

```bash
sudo systemctl reload nginx
```

## 5. 申请 HTTPS 证书

执行：

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

按提示完成邮箱、协议确认和 HTTPS 跳转设置。

成功后访问：
- `https://your-domain.com`
- `https://www.your-domain.com`

## 6. 验证自动续期

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

如果 `dry-run` 成功，后续通常不需要手动续期。

## 7. 防火墙检查

如果服务器启用了 UFW：

```bash
sudo ufw allow 'Nginx Full'
sudo ufw status
```

如果之前放开过 `3000/tcp`，上线后你可以考虑仅保留本机访问 3000，并把公网流量统一走 Nginx。

## 8. 推荐的更稳妥做法

当前 `docker-compose.deploy.yml` 默认发布：
- `${APP_PORT}:3000`

若你准备长期通过 Nginx 暴露公网，可以把应用端口只绑定到本机，例如改成：

```yaml
ports:
  - "127.0.0.1:${APP_PORT:-3000}:3000"
```

变更后执行：

```bash
./scripts/deploy-docker.sh
```

## 9. 故障排查

### 域名能打开但返回 502

通常表示 Nginx 转发到了一个不可用的上游。

检查：

```bash
curl http://127.0.0.1:3000/api/public/categories
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
```

### Certbot 申请失败

通常是以下原因之一：
- 域名未正确解析到服务器
- `80` 端口未放行
- Nginx 配置未生效

先检查：

```bash
sudo nginx -t
curl http://your-domain.com
```

### HTTPS 正常但静态资源异常

检查 Nginx 反代头是否完整，尤其是：
- `Host`
- `X-Forwarded-Proto`

## 10. 相关文档

- `docs/deployment/deployment-v1.md`
- `docs/deployment/deployment-checklist-v1.md`
