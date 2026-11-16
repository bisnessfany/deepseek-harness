---
name: omniroute-modeles
description: Vérifie que le routeur de modèles gratuits OmniRoute répond, liste les modèles qu'il expose et explique comment changer de modèle dans DeepSeek Harness. À utiliser quand une réponse de modèle échoue, quand on demande quels modèles gratuits sont disponibles, ou quand on veut passer à un modèle plus rapide, moins cher ou plus capable.
---

# Modèles gratuits via OmniRoute

OmniRoute est un routeur auto-hébergé : DeepSeek Harness lui envoie les requêtes au format OpenAI, et OmniRoute les transmet au fournisseur gratuit connecté dans son tableau de bord. L'adresse vient de `OMNIROUTE_BASE_URL` (par défaut `http://localhost:20128/v1`) et la clé de `OMNIROUTE_API_KEY`.

## Vérifier que le routeur répond

```sh
curl --silent --show-error --max-time 15 \
  "${OMNIROUTE_BASE_URL:-http://localhost:20128/v1}/models" \
  --header "Authorization: Bearer ${OMNIROUTE_API_KEY:?clé OmniRoute absente}" \
  | head -c 4000
```

- Réponse JSON avec une liste `data` : le routeur fonctionne ; les champs `id` sont les noms de modèles utilisables.
- `Connection refused` ou délai dépassé : OmniRoute n'est pas démarré ou l'adresse est fausse. Indique à l'utilisateur de vérifier le conteneur OmniRoute dans EasyPanel et la variable `OMNIROUTE_BASE_URL`.
- Erreur 401 : la clé est absente ou invalide. Elle se copie dans OmniRoute, menu Dashboard → Endpoints, puis se colle dans le fichier `.env` sous `OMNIROUTE_API_KEY`.

## Modèles virtuels toujours présents

| Modèle | Usage |
|---|---|
| `auto` | Équilibré, choix par défaut d'OmniRoute |
| `auto/cheap` | Le moins cher, souvent gratuit ; modèle de démarrage des sessions |
| `auto/fast` | Réponses rapides pour les tâches simples |
| `auto/smart` | Le plus capable, pour l'analyse et la rédaction longue |
| `auto/coding` | Code et fichiers de configuration |

Un modèle nommé par fournisseur, par exemple `groq/llama-3.3-70b-versatile`, s'ajoute dans le fichier `omniroute.cordis.yml` sous `models`, exactement avec l'identifiant que `/models` renvoie.

## Changer de modèle

- Dans l'interface Web : le sélecteur de modèle en bas de la conversation liste « OmniRoute (modèles gratuits) » ; choisir un modèle le rend aussi par défaut pour les nouvelles sessions.
- Dans un fichier : `agent-default-model` dans `omniroute.cordis.yml` fixe le modèle de départ (`provider: omniroute`, `model: auto/cheap`).

Une session qui a déjà envoyé une requête garde son modèle ; ouvre une nouvelle session pour en changer.
