FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies for PostGIS/GIS tooling
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        binutils \
        gdal-bin \
        libproj-dev \
        libgdal-dev \
        libgeos-dev \
        netcat-traditional \
        gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Keep entrypoint executable even when the app directory is bind-mounted (e.g., on Windows)
RUN cp /app/entrypoint.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
