# SiteKit

This template will help get you started developing with [SvelteKit](https://kit.svelte.dev) in [Site.js](https://sitejs.org).

It’s based on the [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte) template.

__Note:__ if you want to use vanilla Vite + Svelte instead of SvelteKit, check out the [site-vite-svelte](https://github.com/small-tech/site-vite-svelte) template instead. This template also has the advantage, currently, of running the dev server on https://localhost:444 instead of http://localhost:3000. We can’t do that with SvelteKit’s dev server (yet?) as [it doesn’t currently run correctly with HMR over https](https://github.com/sveltejs/kit/issues/844) and [there isn’t a way to set the `server` property directly on its Vite instance](https://github.com/sveltejs/kit/issues/844#issuecomment-817287992).

## Why?

By using [Site.js](https://sitejs.org) you can extend your static SvelteKit clients using dynamic [DotJS](https://sitejs.org/#dynamic-sites) routes, [WebSockets](https://sitejs.org/#websockets), [a JavaScript database](https://sitejs.org/#database), etc., and easily deploy to your own server using the [built-in sync feature](https://github.com/small-tech/site.js#sync).

## Install

1. ### __Either:__

    _Download the template:_

    ```shell
    npm init using small-tech/sitekit my-project
    ```

    This will download this template using [create-using](https://github.com/aral/create-using/tree/create-using#readme) into a directory called `my-project`.

    ### __Or__:

    _Use the template on GitHub:_

    Click the green “Use this template” button on [the GitHub page](https://github.com/small-tech/sitekit) to create your own repository using this template.

    ### __Or__:

    _Do it old-skool:_

    Just fork this repository and clone it as you normally do using `git`.

2. ### __Install dependencies.__

    ```shell
    cd my-project
    npm i
    ```

## Use

### Dev (Site.js + SvelteKit)

```shell
npm run dev
```

This will run the `dev.sh` script that:

1. Will build the latest SvelteKit source using `npx svelte-kit build`
2. Start the SvelteKit dev server in the background
3. Start Site.js.

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
