# Luneo AI Engine

Moteur IA pour génération de textures et rendus 3D photoréalistes.

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Copier `.env.example` vers `.env` et configurer les variables.

## Démarrage

```bash
# Development
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker build -t luneo-ai-engine .
docker run -p 8000:8000 luneo-ai-engine
```

## API Endpoints

- `POST /api/generate/texture` - Génère texture avec texte
- `POST /api/render/preview` - Rendu photoréaliste
- `GET /health` - Health check

## TODO

- [ ] Implémenter trimesh pour manipulation 3D
- [ ] Implémenter pyrender pour rendu
- [ ] Implémenter S3 upload
- [ ] Implémenter Redis cache
- [ ] Ajouter MediaPipe pour détection

