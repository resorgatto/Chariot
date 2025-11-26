#!/bin/sh
set -e

host="${POSTGRES_HOST:-db}"
port="${POSTGRES_PORT:-5432}"

echo "Waiting for database on ${host}:${port}..."
while ! nc -z "$host" "$port"; do
  sleep 1
done

python manage.py migrate --noinput

exec "$@"
