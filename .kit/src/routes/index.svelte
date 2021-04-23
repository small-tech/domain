<script>
  import { onMount } from 'svelte'
  import debounce from '../lib/debounce'
  import _config from '../../../basil.config'

  const config = _config.useDefaults ? {} : _config
  config.domain = config.domain || 'small-web.org'

  let baseUrl

  onMount(() => {
    baseUrl = window.location.hostname
  })

  let domain
  let domainCheckResult = {}
  let errorDetails

  const handleInput = debounce(async () => {
    if (domain.trim() === '') return

    const result = await fetch(`https://${baseUrl}/domain/available/${domain}`)

    console.log(result)

    if (result.status === 200) {
      domainCheckResult = (await result.json()).available
    } else {
      try {
        errorDetails = await result.json()
      } catch (error) {
        console.log('Other error', error)
      }
    }
  }, 300)
</script>

<main>
  <h1>{config.name || 'Basil'}</h1>

  <p>{@html config.description || 'Small Web hosting template.'}</p>

  <form>
    <label for='domain'>Pick your domain</label>
    <input name='domain' type='text' bind:value={domain} on:input={handleInput}>
  </form>

  <p>{domainCheckResult.domain} is {domainCheckResult.available ? 'available' : 'not available'}.</p>

  <p>Error? {errorDetails}</p>
</main>

<style>
  label {
    display: block;
    margin-bottom: 0.5em;
  }
</style>
