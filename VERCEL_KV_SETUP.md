# Vercel KV Setup Guide

The backend now uses Vercel KV (Redis) for persistent data storage instead of in-memory storage.

## Setup Steps:

### 1. Create a Vercel KV Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (odysai)
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **KV (Redis)**
6. Choose a name (e.g., "odysai-kv")
7. Select a region close to your users
8. Click **Create**

### 2. Connect to Your Project

1. After creating the KV database, click **Connect to Project**
2. Select your "odysai" project
3. Vercel will automatically add these environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 3. Redeploy

The next deployment will automatically use the KV database for data persistence.

## What Changed:

- **Before**: Data stored in memory (lost on each deployment)
- **After**: Data stored in Redis (persists across deployments)

## Data Stored:

- Rooms
- Members
- Surveys
- Plan packages
- Trips

## Cost:

Vercel KV free tier includes:
- 256 MB storage
- 3,000 commands per day
- Perfect for development and small projects

For production with more traffic, consider upgrading to a paid plan.
