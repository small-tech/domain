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


    if (result.status === 200) {
      domainCheckResult = await result.json()
      console.log(domainCheckResult)
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

  <form on:submit|preventDefault>
    <label for='domain'>Pick your domain</label>
    <input name='domain' type='text' bind:value={domain} on:input={handleInput}>
  </form>

  {#if domainCheckResult.domain !== undefined}
    <p>
      <strong>{domainCheckResult.domain}.{config.domain}</strong> is
      {@html domainCheckResult.available ? 'available' : '<strong>not</strong> available'}.</p>
  {:else}
    <p>Enter a domain to check if it’s available on <strong>{config.domain}</strong>.</p>
  {/if}

  {#if errorDetails}
    <p>Error? {errorDetails}</p>
  {/if}
</main>

<style>
  label {
    display: block;
    margin-bottom: 0.5em;
  }
</style>
