---
name: n8n-nettoyage-mails
description: Déclenche le workflow n8n « Agent Mails » qui trie les e-mails des dernières 24 heures, archive newsletters, promotions et notifications, et renvoie un mini-rapport. À utiliser quand on demande de ranger, trier ou résumer la boîte mail de Trésor de Miel.
---

# Nettoyage de la boîte mail (n8n)

Le workflow « Agent Mails – Tri, rangement et mini-rapport » tourne seul chaque matin à 7 h (heure de Zurich). Ce skill le lance à la demande ; le rapport revient directement dans la réponse, dans le champ `rapport`.

## Étapes

1. Préviens l'utilisateur que le tri archive les newsletters, promotions et notifications des dernières 24 heures ; les autres e-mails restent en place.
2. Lance la commande ci-dessous. Elle peut prendre jusqu'à deux minutes.
3. Résume le champ `rapport` en quelques lignes : nombre d'e-mails traités, ce qui a été archivé, ce qui demande une action.

## Commande

Le webhook n'attend aucun paramètre ; le corps vide `{}` suffit.

```sh
curl --silent --show-error --fail --max-time 180 \
  --request POST "${N8N_BASE_URL:-https://bisnessfany.app.n8n.cloud}/webhook/mails-nettoyage" \
  --header 'Content-Type: application/json' \
  --data '{}'
```

Si la commande échoue avec une erreur 404, le workflow est dépublié dans n8n : demande à l'utilisateur de l'activer, puis réessaie.
