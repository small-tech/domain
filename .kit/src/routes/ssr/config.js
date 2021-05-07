export async function get() {
  // Get the configuration from Site.js.
  // Since this is only ever relevant during development, not production
  // (where we deploy the generated index page as a static page),
  // we hardcode the URL.
  const config = await (await fetch(`https://localhost/config`)).json()

  return {
    body: config
  }
}
