# Basil

__Work-in-progress (not ready for use).__

Basil is an app for running your own [Small Web](https://small-tech.org/research-and-development) host.

## Is this ready for use?

No. It is currently being developed.

## What does it take to be a Small Web host?

Basil integrates the three main services you need to become a Small Web host:

1. A Domain Name Service (DNS) provider for setting up domains.
2. A Virtual Private Server (VPS) provider for settings up servers.
3. A payment provider to limit access to scarce resources.

## Supported service providers

__(Under development)__

Initially, Basil provides support for the following service providers. You will need to get accounts with them before you can set up your host:

- DNS: [DNSimple](https://dnsimple.com)
- VPS: [Hetzner Cloud](https://www.hetzner.com/cloud)
- Payment: [Stripe](https://stripe.com), tokens

## What is the token payment type?

The Small Web aims to be a bridge between the capitalist centralised web and a post-capitalist humanscale web of individually owned and controlled single-tenant web places. As such, we have the unenviable task of trying to design a system that is both sustainable under capitalism and viable for post-capitalist use.

Supporting both Stripe and tokens as a payment type is an example of this.

A token is simply a secret code that you can enter in place of traditional payment with money.

For example, a municipality might decide that its citizens having their own place on the Small Web is good for human rights and democracy and might budget to provide them with this hosting from the common purse, for the common good. As such, it might create codes that get mailed out to all citizens. They can then use these codes in place of payment. (We prototyped an early version of this with the City of Gent several years ago. Unfortunately, a conservative government came into power and our funding for the project was cut off.)

Traditional/token payment doesn’t have to be mutually exclusive. The municipality in question might, for example, enable both so that people can sign up for more than one Small Web place or if it wants to enable others (e.g., people who are not residents of their city) to sign up.

## Install

1. Install [Site.js](https://sitejs.org)
2. Clone this repo.
3. `npm install`

## Run

### Dev (Site.js + SvelteKit)

```shell
npm run dev
```

Once the servers are running, you will have:

  - __SvelteKit:__ Running at `http://localhost:3000` with HMR and serving the frontend.
  - __Site.js:__ Running at `https://localhost` and serving the backend.

Note: the dev task will only run on Linux-esque systems. If you’re on Windows, please run `site` in one terminal tab and `npm run kit` in another manually to start both servers. Pull requests are welcome for a `dev-windows` task that runs a PowerShell script to do the same thing.

## Configure

Once you have signed up for accounts with the [supported service providers](#supported-service-providers) and are running Basil, you can configure your account at http://localhost:3000/settings.


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
