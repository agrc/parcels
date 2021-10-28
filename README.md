# Utah Parcel Viewer

[![firebase deploy](https://github.com/agrc/parcels/actions/workflows/nodejs.yml/badge.svg)](https://github.com/agrc/parcels/actions/workflows/nodejs.yml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)

This application allows people to find and view the information UGRC has available for all of the county parcels in Utah.

[parcels.utah.gov](https://parcels.utah.gov)

More information about the parcel source data can be found on cadastre data page our [website](https://gis.utah.gov/data/cadastre/parcels).

This application is displaying the UGRC aggregated [Utah Statewide Parcels](https://opendata.gis.utah.gov/datasets/utah::utah-statewide-parcels-1/about) ArcGIS Online service.

## Development

### Set up

Checkout repository and install dependencies

```sh
git clone https://github.com/agrc/parcels.git
cd parcels
npm install
```

### Secrets

Create a `.env.local` file

```env
VITE_DISCOVER_KEY=
VITE_API_KEY=
VITE_FIREBASE_CONFIG=
```

- The discover key can be obtained by following the instructions on our [website](https://gis.utah.gov/discover/#sign-up)
- The API key can be obtained by creating an account on [developer.mapserv.utah.gov](https://developer.mapserv.utah.gov)
- The firebase config can be obtained from [firebase](https://console.firebase.google.com/)

## Deployment

When commits are pushed to the `main` or `dev` branch, a GitHub action is triggered and the website is deployed to Firebase Hosting.

GitHub environments are used with this project to enable deployments to production and development.

Create two environments

- prod
- dev

Within these two environments add the following secrets

- DISCOVER_QUAD_WORD - your discover quad word
- FIREBASE_CONFIG - the config object for firebase analytics
- PROJECT_ID - the google project id
- SERVICE_ACCOUNT - the service account with the roles
  - `roles/storage.admin`
  - `roles/firebase.admin`
  - `roles/serviceusage.apiKeysAdmin`
- WEB_API_KEY - your api.mapserv.utah.gov api key

This project uses [conventional commits](https://conventionalcommits.org/) and [standard version](https://github.com/conventional-changelog/standard-version) to manage the change log and version.

Run

```sh
npm run release
```
