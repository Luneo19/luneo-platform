# Module Generation

Module NestJS pour la génération d'images personnalisées via IA depuis le widget embeddable.

## Structure

```
generation/
├── dto/
│   ├── create-generation.dto.ts      # DTO pour créer une génération
│   └── generation-response.dto.ts    # DTO de réponse
├── providers/
│   ├── ai-provider.factory.ts        # Factory pour gérer les providers IA
│   └── stability.provider.ts        # Provider Stability AI
├── services/
│   ├── prompt-builder.service.ts     # Construction de prompts
│   └── image-processor.service.ts    # Traitement d'images (sharp)
├── generation.controller.ts          # Controller avec endpoints
├── generation.service.ts             # Service principal
├── generation.processor.ts          # Processor Bull pour queue
└── generation.module.ts             # Module NestJS
```

## Endpoints

### Widget (API Key)
- `POST /generation/create` - Créer une génération depuis le widget
- `GET /generation/:publicId/status` - Récupérer le statut
- `GET /generation/:publicId` - Récupérer une génération complète
- `GET /generation/:publicId/ar` - Récupérer les données AR

### Dashboard (JWT)
- `POST /generation/dashboard/create` - Créer depuis le dashboard
- `GET /generation` - Liste des générations (avec pagination)

## Queue

Queue Bull nommée `generation` avec processor `GenerationProcessor` qui traite les jobs `generate`.

## Providers IA

- OpenAI (DALL-E 3)
- Replicate (SDXL)
- Stability AI (SDXL)

## Tests

Le module est testé via :
- Linter (pas d'erreurs)
- Structure de fichiers validée
- Imports vérifiés
- Intégration dans app.module.ts confirmée

## Prochaines étapes

1. Tester avec une vraie requête API
2. Vérifier la queue Bull fonctionne
3. Tester les providers IA
4. Valider l'upload vers Cloudinary


