# Utah Parcel Change Log

- [parcels.utah.gov](https://parcels.utah.gov)
- [open issues](https://github.com/agrc/Parcels/issues?state=open)

## [2.0.0](https://github.com/agrc/Parcels/compare/v1.3.3...v2.0.0) (2021-10-28)


### ⚠ BREAKING CHANGES

* Switching to esri js api 4x, react, and AGOL feature
service

### ♻️ Code Refactoring

* migrate to 4x/react ([e2bfe06](https://github.com/agrc/Parcels/commit/e2bfe0641cd2095847a53c451cb58ba2f8f2d254))
* switch CI/CD to github actions ([fa1fd3e](https://github.com/agrc/Parcels/commit/fa1fd3e761d2c991ea159286dc564eda5db6e2c5))


### 👷 Continuous Integration

* add project secrets ([1421a9c](https://github.com/agrc/Parcels/commit/1421a9cbe6dabf740b48eed011e82abc42d38181))


### ✏️ Docs

* convert changelog to markdown ([14ab448](https://github.com/agrc/Parcels/commit/14ab448b0a8622643d114cddad27c8727e5d97b3))
* update badge ([73aa002](https://github.com/agrc/Parcels/commit/73aa002570e531d673054ceda39dcfcaf8d27563))
* update readme ([4492e29](https://github.com/agrc/Parcels/commit/4492e2908222f296a04c7406fc23b4febdd584cb))


### 🚀 Chores

* add google analytics ([8ce051a](https://github.com/agrc/Parcels/commit/8ce051aa25ca0ff8cc9dfa7b15e6e519ab58928e))
* add standard version ([c96d196](https://github.com/agrc/Parcels/commit/c96d196c62b6bb4197784a03f27e02ea7181ff49))
* **ci:** add caching to firebase ([ed698ef](https://github.com/agrc/Parcels/commit/ed698ef58f0770427558bda8fe23d6d8be532bf8))
* **ci:** add urls ([6f057e0](https://github.com/agrc/Parcels/commit/6f057e0c21d9e9743e1636d53bc0a13626176f65))
* **ci:** filter deployments/actions for only code changes that matter ([3218b08](https://github.com/agrc/Parcels/commit/3218b0824ba08bb6bb8f89d3cd42689689d21f8f))
* **ci:** rename steps ([20ddabc](https://github.com/agrc/Parcels/commit/20ddabcf7b1968c585eca781d437f034b86ee03b))
* clean up ([fcaae44](https://github.com/agrc/Parcels/commit/fcaae446a53bebf4c8fc6bab2869e43a652cf1af))
* ignore ga as it changes every render ([9b08991](https://github.com/agrc/Parcels/commit/9b0899162b80bbaa5e1620d40a183ca4a756834d))
* lowercase package name ([863b11c](https://github.com/agrc/Parcels/commit/863b11c8b625d1a097a8a8999bf1037d7dc87784))
* remove 3x js ([91002c1](https://github.com/agrc/Parcels/commit/91002c19f742fbcbf3ee24c321a8e14d3b2d8a92))
* remove travis ([d0b3145](https://github.com/agrc/Parcels/commit/d0b314539f175074218790f0debb4bf9045ea4b3))
* remove unused importants ([31adc58](https://github.com/agrc/Parcels/commit/31adc581ea780c5fe598ce5da0a548f0f27ff2d6))
* skip log event on default page view ([fe960a4](https://github.com/agrc/Parcels/commit/fe960a4714a9a19994f4358eea11ccd72b6bbfb1))
* specify node version ([54bb3d0](https://github.com/agrc/Parcels/commit/54bb3d0d014573c69f0239c230a3736a3799f1c0))
* trigger action updates on more files ([f48d135](https://github.com/agrc/Parcels/commit/f48d135e413a976b8a1d946822e027b62b558a54))
* update action trigger paths ([a5d92a7](https://github.com/agrc/Parcels/commit/a5d92a7ed39ecdf87775f42385b7337ca0d2e781))
* update caching headers ([525e576](https://github.com/agrc/Parcels/commit/525e576011c854c8cf79562c77be23c384b96d33))
* update npm lock file ([bd8d3ff](https://github.com/agrc/Parcels/commit/bd8d3ff6d36a61969982ff4e6b0ad55ec57a1f70))


### 💄 Styling

* add classes to links ([3128472](https://github.com/agrc/Parcels/commit/3128472f65fbcefd18d4bc497cb1c86fee8c8ed5))
* create a better UX on small screens ([c3ebacb](https://github.com/agrc/Parcels/commit/c3ebacb2121d11eb26a6db65a8f493ee28fd96f0))
* fix linting errors ([5179044](https://github.com/agrc/Parcels/commit/5179044875c3bddadcb3c18f07034d95081e62df))
* use calcite icons ([4459658](https://github.com/agrc/Parcels/commit/4459658a4e9ba5bf7ed2c2a56567a6dd2d2836f7))


### 🐛 Bug Fixes

* **ci:** add env variable ([76c448f](https://github.com/agrc/Parcels/commit/76c448f7ccd41d6e6ee55a1e32aa12e974267726))
* **ci:** add node version to setup ([fb04632](https://github.com/agrc/Parcels/commit/fb04632a70a917a39bdf8435e9b837144092a7b7))
* correct api key for the new staging area ([dedda36](https://github.com/agrc/Parcels/commit/dedda36500381d902334fba67c330f4e774a33c7))
* correct import casing ([ade9484](https://github.com/agrc/Parcels/commit/ade9484b9338af4478d1f22e9e2a212c1f236158))
* don't show default name in hash ([ffd3f2e](https://github.com/agrc/Parcels/commit/ffd3f2e2eaabdc6dc685e915dc270104255a1385))
* format date in short format ([878e573](https://github.com/agrc/Parcels/commit/878e573ccaf3b9dbac6b0c9e8aa1f1db488c52ce)), closes [#64](https://github.com/agrc/Parcels/issues/64)
* increase z index on county select ([fdb8cb5](https://github.com/agrc/Parcels/commit/fdb8cb56750532daf9ffaf1fdfab7732008e2072)), closes [#66](https://github.com/agrc/Parcels/issues/66)
* point at mapserv instead of relative path ([6d24539](https://github.com/agrc/Parcels/commit/6d24539050774bd5d1d985a0fb28814ffc81426f))
* show version from package.json ([56f4faa](https://github.com/agrc/Parcels/commit/56f4faa71efaf669396099cf2a857c9fa5f8dcbe))
* skip logging of empty identify ([d7c1da1](https://github.com/agrc/Parcels/commit/d7c1da134cb2615eb695e06ae80c780757d0f307))
* switch to local favicon ([8764861](https://github.com/agrc/Parcels/commit/8764861f89d970a75d414726c4f40f650eb094bd))
* switch to point to gis.utah.gov favicon ([043efaa](https://github.com/agrc/Parcels/commit/043efaaaea678fd725037f35c668dcf2b9f50838))
* toast when record has no geometry ([4565761](https://github.com/agrc/Parcels/commit/4565761bf2b3b6bef2493d8f23213adc91481515))
* update extension to match file ([d95a10a](https://github.com/agrc/Parcels/commit/d95a10ac6c6ebf7ef507cd611b58f331a129c033))
* use *.dev.utah.gov quad word ([fb3fb1d](https://github.com/agrc/Parcels/commit/fb3fb1de125aee404448c3bed9541de48208655d))
* use the stage task for dev builds ([a892574](https://github.com/agrc/Parcels/commit/a8925740f7383525d6ae166ad85f090263ce057a))

## 1.3.3

Aug 4, 2020

- Point at new print proxy DNS.

## 1.3.2

July 17, 2017

- Show disclaimer on every load. #45
- Remove recorder phone number from identify window. #45

## 1.3.1

Dec 8, 2016

- Forward to <a href="http://parcels.utah.gov">parcels.utah.gov</a>.

## 1.3.0

Nov 10, 2016

- Added a dislaimer dialog that shows on page load.

## 1.2.0

Jan 20, 2016

- Ability to reference individual counties by `/#/CountyName` hash.
- Added unit tests and CI builds.

## 1.1.0

Jan 14, 2016

- Introduce printing.

## 1.0.1

Jan 14, 2016

- Update link to point to parcels directly.

## 1.0.0

Jan 14, 2016

- Hide find parcel error on county change.
- Persist geocoding diamond until subsequent search.

## 0.3.0

Jan 13, 2016

- Added county parcel map links.
- Added side bar toggler.

## 0.2.1

Jan 13, 2016

- Update lables in popup.
- Find parcel and map click act as one.
- Parcel labels are placed better and are more visible.

## 0.2.0

Jan 12, 2016

- Replace search widget with select and intput box.
- Add parcel layer to map as reference.

## 0.1.0

Jan 8, 2016

- Switch to web mercator basemaps.
- Introduce parcel id search.
- Simplify website design.

</body>
</html>