# Ubuntu Nginx + HTTPS V1

最后更新：2026-03-07

这份文档建立在单机 Docker 部署已经完成的前提上，目标是把：
- `http://<服务器IP>:3000`

升级为：
- `https://your-domain.com`

默认前提：
- 服务器系统为 Ubuntu 22.04 / 24.04
- 你已经按 `docs/deployment/deployment-v1.md` 完成单机部署
- 你已经拥有一个解析到服务器公网 IP 的域名

## 1. 推荐结构

- `Nginx` 监听 `80/443`
- `Nginx` 反向代理到本机 `127.0.0.1:3000`
- `Certbot` 申请和续期证书
- Docker 继续负责应用、数据库、worker

## 2. 上 HTTPS 之前先确认

先在服务器本机验证应用已经正常：

```bash
curl http://127.0.0.1:3000/api/public/categories
```

如果这里不通，不要先做 Nginx，先回到：
- `docs/deployment/deployment-v1.md`

另外确认：
- 域名已经解析到服务器公网 IP
- 云安全组已放行 `80/tcp`
- 云安全组已放行 `443/tcp`

## 3. 安装 Nginx 与 Certbot

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

如果 Nginx 未启动：

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 4. 配置 Nginx 反代

假设域名是 `your-domain.com`。

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/nail-booking
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

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/nail-booking /etc/nginx/sites-enabled/nail-booking
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 5. 申请 HTTPS 证书

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

按提示完成邮箱、协议和 HTTPS 跳转设置。

## 6. 修改应用对外地址

启用 HTTPS 后，必须同步修改应用的 `APP_BASE_URL`，否则系统生成的链接仍会指向旧地址。

编辑：

```bash
nano .env.deploy
```

改成：

```env
APP_BASE_URL=https://your-domain.com
```

然后重启部署：

```bash
./scripts/deploy-docker.sh
```

这一步会直接影响：
- LINE 自助绑定链接
- 所有依赖绝对地址生成的功能

## 7. 防火墙检查

如果服务器启用了 UFW：

```bash
sudo ufw allow 'Nginx Full'
sudo ufw status
```

如果公网已经统一走 Nginx，可以考虑不再直接暴露 3000 给外网。

## 8. 更稳妥的生产方式

当前 `docker-compose.deploy.yml` 默认发布：

```yaml
ports:
  - "${APP_PORT:-3000}:3000"
```

如果你准备长期使用 Nginx 对外暴露，可以改成仅绑定本机：

```yaml
ports:
  - "127.0.0.1:${APP_PORT:-3000}:3000"
```

改完后执行：

```bash
./scripts/deploy-docker.sh
```

## 9. 故障排查

### 域名打开后返回 502

通常说明 Nginx 转发到的上游不可用。

检查：

```bash
curl http://127.0.0.1:3000/api/public/categories
docker compose --env-file .env.deploy -f docker-compose.deploy.yml ps
docker compose --env-file .env.deploy -f docker-compose.deploy.yml logs --tail=100 app
```

### Certbot 申请失败

通常是：
- 域名未正确解析
- `80` 端口未放行
- Nginx 配置未生效

检查：

```bash
sudo nginx -t
curl http://your-domain.com
```

### HTTPS 能打开，但 LINE 链接还是旧地址

检查 `.env.deploy`：

```env
APP_BASE_URL=https://your-domain.com
```

然后重新执行：

```bash
./scripts/deploy-docker.sh
```
