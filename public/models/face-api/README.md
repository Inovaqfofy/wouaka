# Face-API.js Models

Ce dossier contient les modèles de détection faciale pour la vérification d'identité Wouaka.

## Installation des modèles

Les modèles sont téléchargés automatiquement depuis le CDN jsdelivr lors de la première utilisation.

## Modèles requis

- `tiny_face_detector_model-weights_manifest.json` - Détection de visage rapide
- `face_landmark_68_model-weights_manifest.json` - Points de repère du visage
- `face_recognition_model-weights_manifest.json` - Reconnaissance faciale
- `face_expression_model-weights_manifest.json` - Expressions faciales

## Utilisation

```typescript
import * as faceapi from 'face-api.js';

// Les modèles sont chargés depuis /models/face-api/
await faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api');
```
