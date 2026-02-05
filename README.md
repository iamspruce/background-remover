# Background Remover (FastAPI + rembg)

Simple image background remover with:
- A FastAPI backend (`backend/`)
- A static frontend (`index.html`, `styles.css`, `app.js`)

## Project structure

```text
bg-remover/
  backend/
    api/
      main.py
      __init__.py
    requirements.txt
    Dockerfile
    __init__.py
  index.html
  styles.css
  app.js
  README.md
  .gitignore
```

## Local setup

### 1) Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: `http://localhost:8000/health`

### 2) Start the frontend

From the project root:

```bash
python -m http.server 9001
```

Then open `http://localhost:9001`.

## Start commands (quick reference)

- Backend start command:
  `uvicorn api.main:app --reload --host 0.0.0.0 --port 8000` (run inside `backend/`)
- Frontend start command:
  `python -m http.server 9001` (run inside project root)

## Frontend API URL

Set the backend URL in `app.js`:

```js
const API_BASE_URL = "http://localhost:8000";
```

For production, replace it with your deployed backend URL.

## Environment variables

- `CORS_ORIGINS`: comma-separated allowed origins
  - Example: `CORS_ORIGINS="http://localhost:9001,https://your-frontend-domain.com"`
- `MAX_UPLOAD_MB`: max file size in MB (default: `16`)
- `MAX_DIMENSION`: max width/height before downscaling (default: `2000`)

## API endpoints

- `GET /health` returns `{ "ok": true }`
- `POST /remove-bg` with multipart `file` returns `image/png`

## Notes

- Allowed file types: PNG, JPG/JPEG, WEBP
- Large images are downscaled before processing
