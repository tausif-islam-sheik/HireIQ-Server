# Deploy HireIQ Backend to Render

## Quick Deploy (BluePrint)

### Option 1: Using render.yaml (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "chore: setup Render deployment config"
   git push
   ```

2. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select `hireiq-server` folder
   - Click **"Apply"**

3. **Render will automatically:**
   - Create PostgreSQL database
   - Deploy web service
   - Run migrations
   - Set environment variables

### Option 2: Manual Setup

#### Step 1: Create Database
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `hireiq-db`
3. Plan: **Free**
4. Click **"Create Database"**
5. Copy the **"Internal Database URL"** for later

#### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Select `hireiq-server` folder
4. Configure:
   - **Name**: `hireiq-server`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build && pnpm run migrate`
   - **Start Command**: `pnpm start`
   - **Plan**: Free

#### Step 3: Environment Variables
Add these in the service dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<from database dashboard>
JWT_SECRET=<generate strong secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://hireiq.vercel.app
OPENAI_API_KEY=sk-your-openai-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
REDIS_URL=<optional - leave blank for now>
SENTRY_DSN=<optional>
```

## Post-Deploy Verification

### 1. Check Health Endpoint
```bash
curl https://your-service-name.onrender.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "HireIQ API is running",
  "data": {
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### 2. Update Frontend API URL
In your frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=https://hireiq-server.onrender.com/api/v1
```

## Free Tier Limitations

| Limit | Value |
|-------|-------|
| **Sleep after inactivity** | 15 minutes |
| **Spin up time** | 30-60 seconds |
| **Database storage** | 1 GB |
| **Database backup** | 7 days retention |
| **Bandwidth** | 100 GB/month |

## Troubleshooting

### Issue: "Build failed"
```bash
# Check if dist folder is in .gitignore
cat .gitignore | grep dist

# Should show: dist/
```

### Issue: "Database connection error"
- Verify `DATABASE_URL` is set correctly
- Check if database is in same region as service

### Issue: "Prisma Client not found"
- Ensure `postinstall` script runs
- Check Render logs for prisma generate output

### Issue: "CORS error"
- Update `CLIENT_URL` to match your actual frontend URL
- Can add multiple origins if needed

## Keep-Alive (Optional)

To prevent cold starts, use a free ping service:

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Add New Monitor
3. Type: HTTP(s)
4. URL: `https://your-service.onrender.com/api/v1/health`
5. Interval: 5 minutes

---

**Your API will be live at:** `https://hireiq-server.onrender.com/api/v1`
