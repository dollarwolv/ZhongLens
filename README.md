# ZhongLens - Use a Popup Dictionary Anywhere

Learning Chinese is hard, mainly because it does not use Roman letters, but Chinese characters. The problem with Chinese characters is that if you encounter a new one, you often do not know what it means, nor how it is pronounced, which makes it difficult to look up in a dictionary. Ordinarily, you would need to pull out your phone and manually write the character into a separate app, which takes time and adds a lot of friction to learning.

That's where pop-up dictionaries come in handy. They let you hover over a Chinese character and immediately see a dictionary definition. However, there is a slight problem: these dictionaries only work on selectable HTML text, not on images, videos with burned-in subtitles, screenshots, or many PDFs.

That's where ZhongLens comes in. ZhongLens scans the visible page for Chinese characters and draws them back onto the page as selectable text, making it possible to use a pop-up dictionary almost anywhere. In practice, that means less friction, faster lookups, and more time actually reading.

## What ZhongLens does

- Captures the visible part of the page in the browser
- Runs OCR on the image, either locally or in the cloud
- Reconstructs the recognized Chinese text as an overlay
- Lets the user select that text so other tools, especially pop-up dictionaries, can work on it

The core idea is simple: if a page doesn't give you selectable text, ZhongLens makes its own.

## Structure of the repo

This repo currently has three main parts:

1. [`/wxt-extension`](./wxt-extension) - the current browser extension, built with WXT, React, and Vite
2. [`/backend`](./backend) - a FastAPI app that provides cloud OCR using PaddleOCR
3. [`/website/zhonglens`](./website/zhonglens) - the Next.js website for marketing, waitlist signup, auth-related flows, and Stripe billing routes

## How the pieces fit together

The browser extension is the main product. It can run OCR locally in the browser with Tesseract.js, or send screenshots to the FastAPI backend for faster and more accurate cloud OCR. The website handles the public-facing side of the project, including the landing page, waitlist, login-related flows, and supporter billing with Stripe. Supabase ties the whole thing together by handling auth and storing subscription and usage data.

Very roughly, the flow looks like this:

1. The user presses a shortcut in the extension
2. The extension captures the visible tab
3. OCR runs either locally or through the backend
4. The extension draws selectable text on top of the original content
5. A pop-up dictionary can now interact with text that was previously locked inside an image

## Tech stack

### `wxt-extension`

- WXT
- React
- Vite
- Tailwind CSS
- Tesseract.js for local OCR
- Supabase for auth/session handling

### `backend`

- FastAPI
- PaddleOCR
- OpenCV
- NumPy
- Supabase Python client

### `website/zhonglens`

- Next.js
- React
- Supabase
- Stripe
- Resend

## Development setup

There are a few ways to work on this repo, depending on what you are trying to do.

### Option 1: Work on the extension only

This is the simplest starting point if you mainly care about the browser experience.

```bash
cd wxt-extension
npm install
npm run dev
```

WXT will automatically open a development Chrome instance with hot-reloading.

Important note: even if you only care about local OCR, the current extension still expects Supabase-related environment variables because auth and account logic are wired into the extension.

### Option 2: Run the cloud OCR backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend exposes:

- `GET /health`
- `POST /ocr/usage/`
- `POST /ocr/`

Cloud OCR is optional from a product perspective, but required if you want to test the faster PaddleOCR path used by the extension.

### Option 3: Run the website

```bash
cd website/zhonglens
npm install
npm run dev
```

By default, the site runs on `http://127.0.0.1:3000`.

## Environment variables

This project uses three separate env files, one for each active app.

### `wxt-extension/.env.local`

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_WEBSITE_URL`
- `VITE_SERVER_OCR_URL`

### `backend/.env`

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `MAX_FREE_REQUESTS`
- `DET_MODEL_DIR`
- `REC_MODEL_DIR`

### `website/zhonglens/.env.local`

Required for the full website flow:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

If you are only editing the landing page UI, you may not need every one of these, but the auth, billing, waitlist, and webhook routes do.

## Common workflows

### Work on OCR overlay behavior

Start the extension and focus on:

- [`/wxt-extension/entrypoints/overlay.content`](./wxt-extension/entrypoints/overlay.content)
- [`/wxt-extension/entrypoints/cropoverlay.content`](./wxt-extension/entrypoints/cropoverlay.content)
- [`/wxt-extension/entrypoints/background/ocr.js`](./wxt-extension/entrypoints/background/ocr.js)

### Work on cloud OCR

Start the backend and extension together. The most relevant files are:

- [`/backend/main.py`](./backend/main.py)
- [`/backend/ocr.py`](./backend/ocr.py)
- [`/wxt-extension/entrypoints/background/ocr.js`](./wxt-extension/entrypoints/background/ocr.js)

### Work on auth, supporter billing, or account flows

You will usually touch both the extension and the website:

- [`/wxt-extension/entrypoints/background/auth.js`](./wxt-extension/entrypoints/background/auth.js)
- [`/wxt-extension/entrypoints/background/payment.js`](./wxt-extension/entrypoints/background/payment.js)
- [`/website/zhonglens/app/api/stripe`](./website/zhonglens/app/api/stripe)
- [`/website/zhonglens/utils/supabase`](./website/zhonglens/utils/supabase)

## Current status

ZhongLens has been released in beta to select beta testers.

At the moment, 180 people have signed up to beta-test the app, and I am slowly but surely releasing it to more people to try it out.

## Why I made this

I wanted the convenience of a pop-up dictionary even when Chinese text was trapped inside images, subtitles, and other places where the browser normally gives you nothing to work with. ZhongLens is my attempt to remove that friction.

If you are also learning Chinese, that tiny reduction in friction matters a lot more than it sounds.
