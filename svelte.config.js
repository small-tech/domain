import adapterStatic from '@sveltejs/adapter-static'
import adapterNode from '@sveltejs/adapter-node'
// import pkg from './package.json';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // By default, `npm run build` will create a standard static app.
    // You can create optimized builds for different platforms by
    // specifying a different adapter
    // adapter: adapterStatic({pages: '.generated', assets: '.generated'}),
    adapter: adapterNode(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte',

    files: {
      assets: '.kit/static',
      lib: '.kit/src/lib',
      routes: '.kit/src/routes',
      template: '.kit/src/app.html',
      hooks: '.kit/src/hooks.js'
    },

    // vite: {
    //   ssr: {
    //     noExternal: Object.keys(pkg.dependencies || {})
    //   }
    // }
  }
}

export default config
