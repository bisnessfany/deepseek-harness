# Trésor de Miel : mode d'emploi

Ce dossier relie l'assistante IA DeepSeek Harness (DSH) à deux services : OmniRoute, qui donne accès à des modèles d'IA gratuits, et n8n, qui exécute les automatisations. Rien n'est publié automatiquement : chaque post, vidéo ou e-mail passe par une validation humaine.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `omniroute.cordis.yml` | Branche DSH sur OmniRoute et choisit le modèle `auto/cheap` pour les nouvelles conversations |
| `n8n-mcp.cordis.yml` | Branche DSH sur n8n ; chaque workflow autorisé devient un outil nommé `mcp__n8n__…` |
| `skills/tresor-de-miel/` | Identité et règles de la marque |
| `skills/n8n-posts-a-valider/` | Envoie des posts à valider par e-mail |
| `skills/n8n-video-marketing/` | Lance la fabrication d'une vidéo verticale |
| `skills/n8n-nettoyage-mails/` | Trie la boîte mail des dernières 24 heures |
| `skills/omniroute-modeles/` | Vérifie OmniRoute et explique comment changer de modèle |

Un « skill » est une fiche d'instructions que l'assistante charge quand une demande s'y rapporte.

## Étape 1 : démarrer OmniRoute

Dans EasyPanel, crée un service Docker avec l'image `diegosouzapw/omniroute` et le port `20128`, ou lance cette commande sur le serveur :

```sh
docker run -d --name omniroute -p 20128:20128 diegosouzapw/omniroute
```

Ouvre ensuite le tableau de bord d'OmniRoute, connecte au moins un fournisseur gratuit, puis copie la clé affichée dans le menu Dashboard → Endpoints.

## Étape 2 : autoriser l'accès dans n8n

Dans n8n, ouvre Settings → Instance-level MCP, active l'accès MCP, puis copie le jeton affiché dans Connection details. Pour chaque workflow que l'assistante peut appeler, ouvre le workflow, clique sur les trois points en haut à droite, puis Settings, et active « Available in MCP ». Le workflow doit aussi être publié.

## Étape 3 : enregistrer les clés

Crée le fichier `.env` dans le dossier de réglages de DSH (`~/.dsh/.env`) avec ces quatre lignes, en remplaçant les valeurs entre chevrons. Ce fichier reste sur ton ordinateur ; ne le partage jamais.

```sh
OMNIROUTE_BASE_URL=http://localhost:20128/v1
OMNIROUTE_API_KEY=<clé copiée dans OmniRoute>
N8N_BASE_URL=https://bisnessfany.app.n8n.cloud
N8N_MCP_TOKEN=<jeton copié dans n8n>
```

Si OmniRoute tourne sur un serveur, remplace `localhost:20128` par l'adresse de ce serveur.

## Étape 4 : installer les skills

```sh
mkdir -p ~/.dsh/skills
cp -R apps/cli/config/examples/tresor-de-miel/skills/. ~/.dsh/skills/
```

## Étape 5 : lancer l'interface

```sh
dsh web \
  --patch "$PWD/apps/cli/config/examples/tresor-de-miel/omniroute.cordis.yml" \
  --patch "$PWD/apps/cli/config/examples/tresor-de-miel/n8n-mcp.cordis.yml"
```

La commande affiche une adresse à ouvrir dans le navigateur.

## Étape 6 : tester

1. Envoie « Bonjour » : une réponse confirme qu'OmniRoute fonctionne.
2. Demande « Liste tes outils dont le nom commence par mcp__n8n__ » : au moins un outil confirme que n8n est relié.
3. Demande « Charge le skill tresor-de-miel et prépare un post Instagram pour Les Sept Seuils » : l'assistante montre le texte, puis l'envoie à valider par e-mail.

Le guide complet, avec le tableau de dépannage, se trouve dans [docs/user/guide/omniroute-n8n.md](../../../../../docs/user/guide/omniroute-n8n.md).
