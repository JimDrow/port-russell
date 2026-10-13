# ⚓ API du port de plaisance de Russell

Application web de gestion des réservations de catways (appontements) pour la capitainerie du port de Russell.

## Fonctionnalités

- API REST privée (authentification JWT) pour gérer les **catways**, les **réservations** et les **utilisateurs**
- Tableau de bord : utilisateur connecté, date du jour, réservations en cours
- Pages de gestion (CRUD) pour les catways, les réservations et les utilisateurs
- Contrôles de validité : numéro de catway unique, type `long`/`short`, dates cohérentes, pas de double réservation, e-mail unique, mot de passe de 8 caractères minimum (haché avec bcrypt)

## Technologies

Node.js, Express, MongoDB (Mongoose), EJS, JWT, Swagger, JSDoc

## Installation

```bash
npm install
```

Créer un fichier `.env` à la racine :

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=une_phrase_secrete
PORT=3000
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@exemple.fr
ADMIN_PASSWORD=motdepasse_8_caracteres_min
```

Importer les données de départ et créer le compte administrateur :

```bash
npm run seed
```

Lancer le serveur :

```bash
npm run dev     # développement (redémarrage automatique)
npm start       # production
```

## Documentation

- Documentation de l'API (Swagger) : `/api-docs`
- Documentation du code (JSDoc) : `/jsdoc` (générée avec `npm run doc`)

## Routes de l'API

| Méthode | Route | Description |
|---|---|---|
| POST | /login | Connexion |
| GET | /logout | Déconnexion |
| GET / POST | /catways | Lister / créer des catways |
| GET / PUT / DELETE | /catways/:id | Détail / modifier l'état / supprimer |
| GET / POST | /catways/:id/reservations | Lister / créer des réservations |
| GET / PUT / DELETE | /catways/:id/reservations/:idReservation | Détail / modifier / supprimer |
| GET / POST | /users | Lister / créer des utilisateurs |
| GET / PUT / DELETE | /users/:email | Détail / modifier / supprimer |

> Note : le brief mentionne `/catway/...` (sans « s ») sur deux routes, et `PUT /catways/:id/reservations` sans identifiant. Par cohérence REST, toutes les routes de réservation utilisent `/catways/:id/reservations/:idReservation`.