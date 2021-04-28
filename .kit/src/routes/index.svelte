<script>
  import { onMount } from 'svelte'
  import { SvelteToast, toast } from '@zerodevx/svelte-toast'
  import debounce from '../lib/debounce'

  // TODO: Improve this so it works when basil.config doesn’t exist.
  import _config from '../../../basil.config'
  import _configDefaults from '../../../basil.config.defaults.js'
  const config = _config.useDefaults ? _configDefaults : _config

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
  let canSignUp = false

  $: if (domainStatusIsUnknown || domainToCheck.trim() === '') {
    checkedDomain = ''
    domainCheckErrorMessage = null
    domainIsAvailable = false
  }
  $: domainCheckError = domainCheckErrorMessage !== null
  $: canSignUp = !domainStatusIsUnknown && domainIsAvailable

  //////////////////////////////////////////////////////////////////////

  const debouncedInputHandler = debounce(async () => {

    // Client-side validation of valid domain names.
    // Via https://github.com/miguelmota/is-valid-hostname/blob/a375657352475b03fbd118e3b46029aca952d816/index.js#L5 implementation of RFC 3696.
    const validHostnameCharacters = /^([a-zA-Z0-9-]+){1,253}$/g
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
    <label for='domain'>Pick a domain on <strong>{hostDomain}</strong></label>

    <!-- This is the only field and always the next gesture
         so, to remove on gesture for everyone on every use, we autofocus it. -->
    <!-- svelte-ignore a11y-autofocus -->
    <input
      name='domain'
      type='text'
      bind:value={domainToCheck}
      on:input={inputHandler}
      class:domain-is-available={canSignUp}
      class:domain-is-not-available={!domainStatusIsUnknown && !domainIsAvailable}
      autofocus
    >

    <button
      class:can-sign-up={canSignUp}
      class:cannot-sign-up={!canSignUp}
    >
      Sign up for {config.currency}{config.price}/month.
    </button>

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
    <p>&nbsp;</p>
    {/if}
  {/if}

  <!--
  <hr>
  <p>Advanced</p>
  <p>TODO: client to install.</p>
  -->

  </form>
</main>

<!-- <SvelteToast /> -->

<style>
  label {
    display: block;
    margin-bottom: 0.5em;
  }

  button {
    border: 0;
    color: white;
    border-radius: 1.33em;
    padding-left: 1em;
    padding-right: 1em;
  }

  .can-sign-up {
    background-color: green;
  }

  .cannot-sign-up {
    background-color: grey;
  }

  .domain-is-available {
    color: green;
  }

  .domain-is-not-available, .domain-check-error {
    color: red;
  }
</style>
