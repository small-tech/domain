<script>
  import { onMount } from 'svelte'
  import { SvelteToast, toast } from '@zerodevx/svelte-toast'
  import debounce from '../lib/debounce'
  import _config from '../../../basil.config'

  const config = _config.useDefaults ? {} : _config
  config.domain = config.domain || 'small-web.org'

  let baseUrl

  onMount(() => {
    baseUrl = window.location.hostname
  })

  //////////////////////////////////////////////////////////////////////
  //
  // State
  //
  //////////////////////////////////////////////////////////////////////

  let hostDomain = config.domain

  let domainToCheck = ''
  let checkedDomain = ''
  let domainIsAvailable = false
  let domainStatusIsUnknown = true
  let domainCheckError = false
  let domainCheckErrorMessage = null

  $: if (domainStatusIsUnknown || domainToCheck.trim() === '') {
    checkedDomain = ''
    domainCheckErrorMessage = null
    domainIsAvailable = false
  }

  $: domainCheckError = domainCheckErrorMessage !== null

  //////////////////////////////////////////////////////////////////////

  const debouncedInputHandler = debounce(async () => {

    // Client-side validation of valid domain names.
    // Via https://github.com/miguelmota/is-valid-hostname/blob/a375657352475b03fbd118e3b46029aca952d816/index.js#L5 implementation of RFC 3696.
    const validHostnameCharacters = /^([a-zA-Z0-9-.]+){1,253}$/g
    if (domainToCheck.trim() === '') return
    if (!validHostnameCharacters.test(domainToCheck)) {
      domainCheckErrorMessage = `Sorry, that’s not a valid domain name.`
      return
    }

    const result = await fetch(`https://${baseUrl}/domain/available/${domainToCheck}`)

    if (result.status === 200) {
      const domainCheckResult = await result.json()
      checkedDomain = domainCheckResult.domain
      domainIsAvailable = domainCheckResult.available
      domainStatusIsUnknown = false
    } else {
      try {
        const errorDetails = await result.json()
        domainCheckErrorMessage = `Error ${errorDetails.code}: ${errorDetails.message}`
      } catch (error) {
        domainCheckErrorMessage = error
      }
    }
  }, 300)

  const inputHandler = () => {
    // Signal that input is changing so domain state can be set to neutral.
    domainStatusIsUnknown = true
    debouncedInputHandler()
  }
</script>

<main>
  <h1>{config.name || 'Basil'}</h1>

  <p>{@html config.description || 'Small Web hosting template.'}</p>

  <form on:submit|preventDefault>
    <label for='domain'>Pick your domain</label>
    <input
      name='domain'
      type='text'
      bind:value={domainToCheck}
      on:input={inputHandler}
      class:domain-is-available={!domainStatusIsUnknown && domainIsAvailable}
      class:domain-is-not-available={!domainStatusIsUnknown && !domainIsAvailable}
      autofocus
    >
  </form>

  {#if !domainStatusIsUnknown}
    <p
      class:domain-is-available={domainIsAvailable}
      class:domain-is-not-available={!domainIsAvailable}
    >
      {domainIsAvailable ? '✔️' : '❌️' }
      <strong>{checkedDomain}.{hostDomain}</strong> is
      {@html domainIsAvailable ? '' : '<strong>not</strong>'} available.
    </p>
  {:else}
    {#if domainCheckError}
      <p class=domain-check-error>❌️ {domainCheckErrorMessage}</p>
    {:else}
      <p>Enter a domain to check if it’s available on <strong>{hostDomain}</strong>.</p>
    {/if}
  {/if}
</main>
<SvelteToast />

<style>
  label {
    display: block;
    margin-bottom: 0.5em;
  }

  .domain-is-available {
    color: green;
  }

  .domain-is-not-available, .domain-check-error {
    color: red;
  }
</style>
