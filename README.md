# Background Remover (FastAPI + rembg)

Simple, production-shaped background removal app:

- `api/` is a FastAPI service ready for Cloud Run.
- `web/` is static HTML/CSS/JS for GitHub Pages.

## Project structure

```
bg-remover/
  api/
    app/
      main.py
    requirements.txt
    Dockerfile
    .dockerignore
  web/
    index.html
    styles.css
    app.js
  README.md
  .gitignore
```

## Backend (local dev)

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check: `http://localhost:8000/health`

### Environment variables

- `CORS_ORIGINS`: comma-separated list of allowed origins.
  - Example: `CORS_ORIGINS="http://localhost:5500,https://<your-user>.github.io/<repo>"`
- `MAX_UPLOAD_MB`: max file size in MB (default: `16`).
- `MAX_DIMENSION`: max width/height before downscaling (default: `2000`).

### API endpoints

- `GET /health` → `{ "ok": true }`
- `POST /remove-bg` (multipart `file`) → `image/png`

## Frontend

Open `web/index.html` with a local static server (VS Code Live Server, `python -m http.server`, etc.).

Set the API URL in `web/app.js`:

```js
const API_BASE_URL = "http://localhost:8000"; // replace with your production URL
```

## Notes

- Allowed file types: PNG, JPG/JPEG, WEBP.
- Images larger than `MAX_DIMENSION` are downscaled before processing.
