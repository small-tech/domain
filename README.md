# Basil

__Work-in-progress (not ready for use).__

[Small Web](https://small-tech.org/research-and-development) host.

This will help get you started with running your own Small Web host.

## Install

1. Install [Site.js](https://sitejs.org)
2. Clone this repo.
3. `npm install`

## Configure

Configure the details of your site in the `/admin` route.

## Use

### Dev (Site.js + SvelteKit)

1. Run `site`
2. Run `npm run build`
3. Run `npm run kit`

(This process will be streamlined in the future.)

Once the servers are running, you will have:

  - __SvelteKit:__ Running at `http://localhost:3000` with HMR.
  - __Site.js:__ Running at `https://localhost` with all features (including serving dynamic [DotJS](https://sitejs.org/#dynamic-sites) routes and [WebSockets](https://sitejs.org/#websockets), etc.)

Note that the SvelteKit build is _not_ automatically updated when hitting the Site.js endpoint. To update it, run the build command (see below).

Also note that the `dev.sh` script will only run on Linux-esque systems. If you’re on Windows, please run the commands listed above manually. Pull requests are welcome for a `dev-windows` task that runs a PowerShell script to do the same thing.

### SvelteKit only

```shell
npm run kit
```

This will run the SvelteKit dev server _only_ (not Site.js) at `http://localhost:3000`.

### Build

```shell
npm run build
```

This will build the SvelteKit source into the `.generated` folder that is served by Site.js.

### Serve

```shell
npm run serve
```

This will:

1. Build the latest Vite source using `vite build`
2. Serve the site using Site.js.

Hit `https://localhost` to view and test your site.

_Note that the Vite dev server will not be run. If that’s what you want, please run the dev task._


## LICENSE

Copyright ⓒ 2021-present [Aral Balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

Released under AGPL version 3.0.
