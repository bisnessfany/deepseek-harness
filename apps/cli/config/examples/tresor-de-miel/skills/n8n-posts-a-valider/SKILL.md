---
name: n8n-posts-a-valider
description: Envoie des posts Instagram, Facebook et TikTok rédigés par l'IA au workflow n8n « Marketing – Posts à valider », qui les transmet par e-mail pour validation humaine sans rien publier. À utiliser quand on demande de préparer, proposer ou envoyer des posts pour les réseaux sociaux de Trésor de Miel.
---

# Posts à valider (n8n)

Ce skill appelle le workflow n8n « Marketing – Posts à valider (compétence IA) ». Le workflow envoie les textes par e-mail à Stéphanie et répond à l'agent. Rien n'est publié.

## Étapes

1. Charge d'abord le skill `tresor-de-miel` pour le ton, les règles et les adresses officielles.
2. Rédige les textes demandés. Laisse vide la plateforme qu'on ne t'a pas demandée.
3. Montre les textes à l'utilisateur dans ta réponse, puis envoie-les au workflow avec la commande ci-dessous.
4. Rapporte la réponse du workflow (`statut`, `message`, `plateformes`) en une phrase. En cas d'erreur réseau, dis-le clairement et propose de réessayer.

## Commande

Remplace les valeurs, garde la structure. L'adresse de base vient de `N8N_BASE_URL` si elle est définie, sinon de l'instance Trésor de Miel.

```sh
curl --silent --show-error --fail --max-time 60 \
  --request POST "${N8N_BASE_URL:-https://bisnessfany.app.n8n.cloud}/webhook/marketing-posts-a-valider" \
  --header 'Content-Type: application/json' \
  --data @- <<'JSON'
{
  "sujet": "Nouveau miel de printemps",
  "instagram": "Texte Instagram avec hashtags",
  "facebook": "Texte Facebook avec appel à l'action",
  "tiktok": "Accroche TikTok puis hashtags",
  "image_url": "https://exemple.ch/image.jpg",
  "date_souhaitee": "2026-11-20",
  "notes": "Remarques pour la validation"
}
JSON
```

## Champs du message

| Champ | Obligatoire | Contenu |
|---|---|---|
| `sujet` | oui | Titre court du post, repris dans l'objet de l'e-mail |
| `instagram` | non | Légende Instagram complète |
| `facebook` | non | Légende Facebook complète |
| `tiktok` | non | Légende TikTok complète |
| `image_url` | non | Lien `https://` vers l'image à utiliser |
| `date_souhaitee` | non | Date de publication souhaitée, format `AAAA-MM-JJ` |
| `notes` | non | Contexte utile pour la personne qui valide |

Le workflow répond en JSON avec `statut` (« envoyé pour validation »), `message` et `plateformes` (liste des plateformes renseignées).
