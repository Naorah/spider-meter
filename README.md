# Spider-Meter

Landing page et backend léger pour suivre l’habitat d’un terrarium (humidité, température) alimenté par une **Shelly Plus H&T** (ou compatible). Les lectures sont stockées en **SQLite** et affichées en temps réel avec historique graphique.

## Fonctionnement

```text
Shelly H&T  ──GET /report?hum&temp&id&token──►  SvelteKit (Node)
                                                    │
                                                    ├─► SQLite (Prisma)
                                                    └─► logs/report.log

Navigateur  ──GET /──────────────────────────►  Landing (hero, fiche, habitat, graphiques)
              ──GET /api/sensors (30 s)──────►  Rafraîchissement auto habitat + historique
```

1. La Shelly envoie périodiquement (ou sur seuil) une requête **HTTP GET** vers `/report`.
2. Le serveur vérifie le **token**, enregistre humidité / température / id appareil + horodatage, et journalise l’appel.
3. La page d’accueil charge les dernières valeurs et l’historique ; le client interroge `/api/sensors` **toutes les 30 secondes** pour mettre à jour l’habitat et les graphiques sans recharger la page.

Les « trous » dans les graphiques sont normaux : ils reflètent les intervalles réels entre deux rapports Shelly.

---

## Prérequis

- **Node.js 20+**
- **npm**
- En production : **PM2** (`npm install -g pm2`)
- Optionnel : reverse proxy (**Nginx**, **Caddy**) + nom de domaine en HTTPS (recommandé pour la Shelly depuis Internet)

---

## Installation locale (développement)

```bash
git clone <votre-repo> spider-meter
cd spider-meter
cp .env.example .env
# Éditer .env (voir section Variables d'environnement)
npm install
npx prisma migrate dev    # crée dev.db + applique les migrations
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

Test manuel de l’endpoint :

```bash
curl "http://localhost:5173/report?hum=54&temp=21.75&id=shellyht-TEST&token=VOTRE_IOT_SERVER_TOKEN"
# Réponse attendue : OK
```

---

## Variables d'environnement

Copier [`.env.example`](.env.example) vers `.env` à la racine du projet.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | URL SQLite Prisma. Ex. `file:./dev.db` (dev) ou chemin **absolu** en prod : `file:/opt/spider-meter/data/spider.db` |
| `IOT_SERVER_TOKEN` | Oui | Secret partagé avec la Shelly, passé en query `?token=` sur `/report` |
| `CHART_READINGS_LIMIT` | Non | Nombre de points dans les graphiques (défaut : `72`) |
| `PORT` | Non | Port du serveur Node en prod (défaut PM2 : `1212`) |
| `HOST` | Non | Interface d’écoute (défaut : `0.0.0.0`) |
| `ORIGIN` | Non | URL publique du site (`https://mon-domaine.fr`) si les meta Open Graph / embeds sont incorrects derrière un proxy |
| `LOG_DIR` | Non | Dossier des logs (défaut : `logs/`) |
| `REPORT_LOG_PATH` | Non | Fichier de log des appels `/report` (défaut : `logs/report.log`) |
| `LOG_LEVEL` | Non | Niveau Pino : `info`, `warn`, `debug`, etc. |

Exemple `.env` minimal :

```env
DATABASE_URL="file:./dev.db"
IOT_SERVER_TOKEN="remplacer-par-un-secret-long"
CHART_READINGS_LIMIT=72
```

---

## Personnalisation

### Fiche de l’araignée

Éditer [`src/lib/spider.ts`](src/lib/spider.ts) :

```ts
export const spider = {
  name: '…',
  commonName: '…',
  scientificName: 'Phidippus regius',
  speciesNotes: '…',
  movedInLabel: '15 mai 2026'
};
```

### Image hero et embeds (réseaux sociaux)

- Placer la photo dans [`static/phidippus.jpg`](static/phidippus.jpg) (servie sur `/phidippus.jpg`).
- Titre, description et meta : [`src/lib/site.ts`](src/lib/site.ts) + [`src/routes/+layout.svelte`](src/routes/+layout.svelte).

### Limite d’historique des graphiques

Variable `CHART_READINGS_LIMIT` dans `.env`.

---

## Shelly Plus H&T — configuration HTTP

L’application n’expose que des **requêtes GET**. La Shelly doit appeler une URL de la forme :

```text
https://VOTRE-DOMAINE/report?hum=<humidité>&temp=<température>&id=<id-appareil>&token=<IOT_SERVER_TOKEN>
```

### Paramètres acceptés

| Paramètre | Obligatoire | Description |
|-----------|-------------|-------------|
| `token` | Oui | Doit être **identique** à `IOT_SERVER_TOKEN` dans `.env` |
| `hum` | Oui | Humidité relative (nombre, ex. `54`) |
| `temp` | Oui* | Température en °C (ex. `21.75`) |
| `tmp` | Oui* | Alias accepté à la place de `temp` |
| `id` | Non | Identifiant appareil (ex. `shellyht-6C9222`). Défaut : `unknown` |

\* Au moins `temp` **ou** `tmp` doit être présent et valide.

Réponses :

| Code | Signification |
|------|----------------|
| `200` + corps `OK` | Lecture enregistrée |
| `401` | Token absent ou incorrect |
| `400` | `hum` ou température manquants / invalides |

### Exemple d’URL complète (à adapter)

Remplacez les valeurs entre chevrons :

```text
https://spider-meter.example.com/report?hum=<humidite>&temp=<temperature>&id=shellyht-6C9222&token=<votre-secret>
```

### Configuration dans l’app Shelly (Gen2 / Plus)

Les noms de variables dépendent du firmware. Procédure générale :

1. Ouvrir l’app **Shelly** → sélectionner le **Plus H&T**.
2. Aller dans **Actions** (ou **Webhooks** / **Scènes** selon version).
3. Créer une action du type **Appel URL** / **HTTP GET** (pas POST).
4. Coller l’URL avec les placeholders fournis par Shelly pour humidité et température.

Exemples de placeholders courants (à vérifier dans l’interface Shelly) :

| Donnée | Exemples de variables Shelly |
|--------|------------------------------|
| Humidité | `{rh}`, `$rh`, ou variable proposée par l’assistant |
| Température | `{tC}`, `$tC`, `{temperature}`, etc. |
| ID appareil | ID affiché dans l’app ou MAC (ex. `shellyht-XXXXXX`) |

**Exemple d’URL dans l’app Shelly** (syntaxe indicative — adaptez aux variables affichées par votre firmware) :

```text
https://spider-meter.example.com/report?hum={rh}&temp={tC}&id=shellyht-6C9222&token=MON_SECRET_ICI
```

5. Définir la fréquence ou le déclencheur (intervalle régulier, seuil humidité/température, etc.).
6. Sauvegarder et vérifier dans les logs serveur (`logs/report.log`) qu’une ligne `status: "success"` apparaît.

> **Sécurité :** le token est dans l’URL. Utilisez **HTTPS** en production et un token long et aléatoire. Ne commitez jamais `.env`.

### Test depuis un PC

```bash
curl -i "https://spider-meter.example.com/report?hum=52&temp=22.1&id=shellyht-test&token=VOTRE_TOKEN"
```

---

## Mise en production (PM2)

### 1. Préparer le serveur

```bash
git clone <votre-repo> /opt/spider-meter
cd /opt/spider-meter
cp .env.example .env
nano .env   # DATABASE_URL absolu, IOT_SERVER_TOKEN, PORT, ORIGIN si besoin
mkdir -p data logs
```

Exemple `.env` prod :

```env
DATABASE_URL="file:/opt/spider-meter/data/spider.db"
IOT_SERVER_TOKEN="secret-production"
CHART_READINGS_LIMIT=72
PORT=1212
ORIGIN=https://spider-meter.example.com
```

### 2. Installer, migrer, builder

```bash
npm ci
npm run db:deploy      # prisma migrate deploy
npm run build
```

### 3. Démarrer avec PM2

```bash
npm run pm2:start
pm2 save
pm2 startup            # suivre les instructions affichées
```

Fichier de config : [`ecosystem.config.cjs`](ecosystem.config.cjs) (charge `.env`, lance `build/index.js`).

```bash
npm run pm2:logs
npm run pm2:restart    # après un déploiement
```

### 4. Reverse proxy (recommandé)

Exposer **HTTPS** sur le port 443 et proxy vers `http://127.0.0.1:1212` (ou votre `PORT`). La Shelly doit pouvoir joindre `https://votre-domaine/report?...`.

### 5. Sauvegardes

Sauvegarder régulièrement le fichier SQLite pointé par `DATABASE_URL` (ex. `data/spider.db`).

---

## Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build production (`build/`) |
| `npm run start` | Lance `node build/index.js` |
| `npm run db:migrate` | Migration Prisma en dev |
| `npm run db:deploy` | Migration Prisma en prod |
| `npm run pm2:start` | Démarre l’app via PM2 |
| `npm run pm2:restart` | Redémarre le processus PM2 |
| `npm run pm2:logs` | Affiche les logs PM2 |
| `npm run check` | Vérification TypeScript / Svelte |

---

## API & logs

| Route | Méthode | Description |
|-------|---------|-------------|
| `/` | GET | Landing page |
| `/report` | GET | Ingestion Shelly (token requis) |
| `/api/sensors` | GET | JSON `{ latest, history }` pour le polling client |

Logs des appels `/report` : fichier JSON structuré (Pino), par défaut **`logs/report.log`**. Le token y est masqué (`[redacted]`).

```bash
tail -f logs/report.log
```

---

## Stack technique

- [SvelteKit 5](https://kit.svelte.dev/) + [adapter-node](https://github.com/sveltejs/kit/tree/master/packages/adapter-node)
- [Prisma 5](https://www.prisma.io/) + SQLite
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/) + [Phosphor Icons](https://github.com/phosphor-icons/phosphor-svelte)
- [PM2](https://pm2.keymetrics.io/) + [Pino](https://getpino.io/)

---

## Dépannage

| Problème | Piste |
|----------|--------|
| `401` sur `/report` | Vérifier que `token=` dans l’URL Shelly = `IOT_SERVER_TOKEN` dans `.env` |
| `400` sur `/report` | Vérifier `hum` et `temp` (ou `tmp`) numériques dans l’URL |
| Pas de données sur la page | Tester `curl /report`, puis `curl /api/sensors` |
| Embed sans image | Fichier `static/phidippus.jpg` présent + `ORIGIN` correct en prod |
| `prisma migrate deploy` échoue | `DATABASE_URL` défini dans `.env`, dossier parent du `.db` existant |
| `npm i` échoue sur Prisma | Lancer `npx svelte-kit sync` puis `npx prisma generate` |

---

## Licence

Projet privé — usage personnel.
