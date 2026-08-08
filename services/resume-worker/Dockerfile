# Simple Dockerfile for the Python extraction worker (FastAPI + Uvicorn).

FROM python:3.11-slim

WORKDIR /app

# System deps needed by PDF/NLP/OCR libraries (pdfplumber, PyMuPDF, pytesseract, pdf2image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY services/resume-worker/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Download the small spaCy English model at build time so first request isn't slow.
RUN python -m spacy download en_core_web_sm

COPY services/resume-worker ./

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
