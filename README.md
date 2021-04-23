# Basil

__Work-in-progress (not ready for use).__

[Small Web](https://small-tech.org/research-and-development) host.

This template will help get you started with running your own Small Web host.

## Install

1. ### __Either:__

    _Download the template:_

    ```shell
    npm init using small-tech/basil my-small-web-host.org
    ```

    This will download this template using [create-using](https://github.com/aral/create-using/tree/create-using#readme) into a directory called `my-small-web-host.org`.

    ### __Or__:

    _Use the template on GitHub:_

    Click the green “Use this template” button on [the GitHub page](https://github.com/small-tech/basil) to create your own repository using this template.

    ### __Or__:

    _Do it old-skool:_

    Just fork this repository and clone it as you normally do using `git`.

2. ### __Install dependencies.__

    ```shell
    cd my-project
    npm i
    ```

## Configure

Configure the details of your site by updating the `basil.config.js` file in the root directory of this project.

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
