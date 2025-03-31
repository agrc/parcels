# Utah Parcel Viewer

[![release status](https://github.com/agrc/parcels/actions/workflows/release.yml/badge.svg)](https://github.com/agrc/parcels/actions/workflows/release.yml)
[![build status](https://github.com/agrc/parcels/actions/workflows/push.yml/badge.svg)](https://github.com/agrc/parcels/actions/workflows/push.yml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This application allows people to find and view the information UGRC has available for all of the county parcels in Utah.

[parcels.utah.gov](https://parcels.utah.gov)

More information about the parcel source data can be found on the cadastre product page on our [website](https://gis.utah.gov/products/sgid/cadastre/parcels/).

This application is displaying the UGRC aggregated [Utah Statewide Parcels](https://opendata.gis.utah.gov/datasets/utah::utah-statewide-parcels-1/about) ArcGIS Online service.

## Development

### Set up

Checkout repository and install dependencies

```sh
git clone https://github.com/agrc/parcels.git
cd parcels
pnpm install
```

### Secrets

Duplicate the `.env` file to a `.env.local` file and do not check it into source control.

- The discover key can be obtained by following the instructions on our [website](https://gis.utah.gov/discover/)
- The API key can be obtained by creating an account on the UGRC API [self-service website](https://developer.mapserv.utah.gov)
- The firebase config can be obtained from [firebase](https://console.firebase.google.com/)

This project uses [conventional commits](https://conventionalcommits.org/) and [release please](https://github.com/googleapis/release-please) to manage the change log and versioning.
