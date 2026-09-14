# Vercel Deployment & Custom Domain Guide

This guide outlines how to deploy GYM BRAND to Vercel for free, and the exact steps to attach a custom domain (like `gymbrand.in`) later when you are ready.

---

## Phase 1: Before You Deploy (Action Required)
Because Vercel is a "serverless" platform, it does not have a permanent hard drive. Currently, your app saves image uploads to a local folder. 
**Before deploying to Vercel, you must switch your storage to Supabase.**

1. Create an S3 bucket in your Supabase project (e.g., `gymbrand-storage`).
2. Update the codebase to upload files to this Supabase bucket instead of the local disk.
3. Update your `.env` to use `STORAGE_PROVIDER="supabase"`.

---

## Phase 2: Initial Deployment (Free `.vercel.app` domain)
1. Push your code to a GitHub repository.
2. Log in to [Vercel.com](https://vercel.com) using your GitHub account.
3. Click **Add New Project** and select your GYM BRAND repository.
4. Open the **Environment Variables** section. Copy all the variables from your local `.env` file and paste them here.
5. Click **Deploy**. Vercel will generate a free live URL (e.g., `https://gymbrand.vercel.app`).

---

## Phase 3: Upgrading to a Custom Domain Later
When you purchase your custom domain (e.g., `gymbrand.in`) from GoDaddy, Hostinger, or Namecheap, follow these 4 steps to switch over. **No server migration is required.**

### 1. Add Domain to Vercel
* Go to your Vercel Dashboard -> Click your project -> **Settings** -> **Domains**.
* Type in your new domain (`gymbrand.in`) and click **Add**.

### 2. Update DNS Records
Vercel will show an "Invalid Configuration" screen and give you an A-Record.
* **Type:** A
* **Name:** `@`
* **Value:** `76.76.21.21` *(Vercel will provide the exact IP on screen)*
* Log into the website where you bought the domain (e.g., GoDaddy), open **DNS Settings**, and paste this record. 
* Within a few minutes, Vercel will turn green and automatically generate a free secure SSL lock (HTTPS) for you.

### 3. Update Vercel Environment Variables
Your app code needs to know its new address so things like Password Reset emails generate the correct links.
* In Vercel, go to **Settings** -> **Environment Variables**.
* Edit `NEXT_PUBLIC_SITE_URL` and change it from `https://gymbrand.vercel.app` to `https://gymbrand.in`.

### 4. Update Razorpay Webhooks
* Log into the [Razorpay Dashboard](https://dashboard.razorpay.com).
* Go to **Account & Settings** -> **Webhooks**.
* Edit your webhook and change the URL to your new domain: `https://gymbrand.in/api/webhooks/razorpay`

*(Note: Your old `.vercel.app` link will automatically redirect users to your new custom domain, so you won't lose any traffic).*
