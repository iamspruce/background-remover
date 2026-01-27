from __future__ import annotations

import os
from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, ImageOps, UnidentifiedImageError
from rembg import new_session, remove

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "16"))
MAX_DIMENSION = int(os.getenv("MAX_DIMENSION", "2000"))

CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "")
if CORS_ORIGINS_ENV:
    CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:9001",
        "http://127.0.0.1:9001",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8000",
    ]

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

session = None


@app.on_event("startup")
def load_model() -> None:
    global session
    session = new_session("u2net")


@app.get("/health")
def health() -> dict:
    return {"ok": True}


async def read_upload_with_limit(upload: UploadFile, max_bytes: int) -> bytes:
    buffer = BytesIO()
    bytes_read = 0
    chunk_size = 1024 * 1024

    while True:
        chunk = await upload.read(chunk_size)
        if not chunk:
            break
        bytes_read += len(chunk)
        if bytes_read > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max {MAX_UPLOAD_MB}MB.",
            )
        buffer.write(chunk)

    return buffer.getvalue()


def downscale_image(image: Image.Image, max_dimension: int) -> Image.Image:
    width, height = image.size
    if max(width, height) <= max_dimension:
        return image

    scale = max_dimension / float(max(width, height))
    new_size = (int(width * scale), int(height * scale))
    return image.resize(new_size, Image.Resampling.LANCZOS)


@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)) -> Response:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use PNG, JPG, or WEBP.",
        )

    image_bytes = await read_upload_with_limit(file, MAX_UPLOAD_MB * 1024 * 1024)

    try:
        image = Image.open(BytesIO(image_bytes))
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Could not read image file.")

    image = ImageOps.exif_transpose(image)
    image = downscale_image(image, MAX_DIMENSION)

    output = remove(image, session=session)
    if isinstance(output, Image.Image):
        buffer = BytesIO()
        output.save(buffer, format="PNG")
        output_bytes = buffer.getvalue()
    else:
        output_bytes = output

    return Response(content=output_bytes, media_type="image/png")
