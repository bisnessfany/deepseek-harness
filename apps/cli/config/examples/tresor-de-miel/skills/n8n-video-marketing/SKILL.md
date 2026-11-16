---
name: n8n-video-marketing
description: Lance la fabrication d'une vidéo verticale marketing (TikTok, Reels, Shorts) avec ses légendes via le workflow n8n « Vidéos marketing – prêtes à valider ». La vidéo et les textes arrivent par e-mail pour validation ; rien n'est publié. À utiliser quand on demande une vidéo promotionnelle pour un produit ou pour l'application Les Sept Seuils.
---

# Vidéo marketing (n8n)

Ce skill appelle le webhook IA du workflow « Vidéos marketing – prêtes à valider (sans publication) ». n8n rédige les légendes avec un modèle gratuit (Groq), fabrique la vidéo 1080×1920 avec Creatomate, puis envoie le lien et les légendes par e-mail. Le rendu prend environ trois minutes.

## Étapes

1. Charge d'abord le skill `tresor-de-miel`.
2. Réunis les informations : produit ou sujet, description avec arguments de vente, public cible, image et page produit si disponibles. Pour Les Sept Seuils, la page est toujours `https://seuils.tresordemiel.ch`.
3. Envoie la demande avec la commande ci-dessous. Le webhook répond immédiatement « Workflow got started. » : la vidéo n'est pas encore prête à ce moment-là.
4. Explique à l'utilisateur qu'un e-mail arrivera dans quelques minutes avec le lien vidéo (aperçu basse résolution, sans musique) et les légendes à copier-coller.

## Commande

```sh
curl --silent --show-error --fail --max-time 30 \
  --request POST "${N8N_BASE_URL:-https://bisnessfany.app.n8n.cloud}/webhook/video-marketing-ia" \
  --header 'Content-Type: application/json' \
  --data @- <<'JSON'
{
  "topic": "Les Sept Seuils",
  "description": "Application de suivi personnel en sept étapes, essai gratuit",
  "image_url": "",
  "product_url": "https://seuils.tresordemiel.ch",
  "audience": "Adultes francophones curieux de développement personnel",
  "language": "Français"
}
JSON
```

## Champs du message

| Champ | Obligatoire | Contenu |
|---|---|---|
| `topic` | oui | Produit ou sujet ; affiché en titre dans la vidéo |
| `description` | oui | Arguments de vente ; n'invente rien |
| `image_url` | non | Lien `https://` vers l'image de fond ; vide pour un fond uni |
| `product_url` | non | Page produit ou boutique affichée en fin de vidéo |
| `audience` | non | Public cible |
| `language` | non | Langue des textes, `Français` par défaut |

Si `topic` contient « seuil », le workflow force la page `seuils.tresordemiel.ch` et choisit une image de l'application quand aucune image n'est donnée.
