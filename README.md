# Ethar Pharmacy

E-commerce platform for Ethar Pharmacy — product catalog, cart, checkout, and admin management.

## Stack

- **Backend**: Django 5 + Django REST Framework + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Reverse Proxy**: Nginx (HTTPS via Let's Encrypt)
- **Deployment**: Docker Compose on Ubuntu VPS

## Project Structure

```
/backend          Django API (DRF)
/frontend         Next.js storefront
/nginx            Nginx config & SSL
docker-compose.yml
```

## Quick Start (Local)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

## Production Deployment

See `docker-compose.yml` and `nginx/nginx.conf` for the full production setup.
