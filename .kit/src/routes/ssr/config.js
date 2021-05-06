import { dev } from '$app/env'

const baseUrl = dev ? 'https://localhost' : ''

export async function get() {
  const config = await (await fetch(`${baseUrl}/config`)).json()

  return {
    body: config
  }
}
