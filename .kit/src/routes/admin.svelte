<script>
  import { onMount } from 'svelte'

  let errorMessage = null
  let password = null
  let signingIn = false
  let signedIn = true
  let baseUrl

  let dnsAccountIdIsShowing = false
  let dnsZoneIdIsShowing = false
  let dnsAccessTokenIsShowing = false

  let dnsAccountId
  let dnsZoneId
  let dnsAccessToken

  // Dummy data for now.
  const hostDetails = {
    name: 'Small-Web.org',
    domain: 'small-web.org',
    description: `<a href='https://small-tech.org/research-and-development'>Small Web</a> host.`,
    currency: '€',
    price: 15,

    dns: {
      provider: 'DNSimple',
      accountId: '000000',
      zoneId: '123456',
      accessToken: 'asecretaccesstoken'
    }
  }

  $: if (signingIn) errorMessage = false

  onMount(() => {
    baseUrl = document.location.hostname
  })

  function toggle(element, toggleButton) {
    if (element.type === 'password') {
      element.type = 'text'
      toggleButton.innerText = 'Hide'
    } else {
      element.type = 'password'
      toggleButton.innerText = 'Show'
    }
  }

  async function signIn () {
    signingIn = true
    let response
    try {
      response = await fetch(`https://${baseUrl}/admin/sign-in/${password}`)
    } catch (error) {
      errorMessage = `Network error: ${error}`
      signingIn = false
      return
    }
    if (response.status !== 200) {
      errorMessage = `Network error (${response.status})`
      signingIn = false
      return
    } else {
      try {
        signedIn = (await response.json()).ok
      } catch (erorr) {
        errorMesage = `Could not parse response (${error}).`
        signingIn = false
        return
      }
      if (!signedIn) {
        errorMessage = 'Password is incorrect.'
      }
    }
    signingIn = false
  }
</script>

<h1>Admin page</h1>

{#if !signedIn}
  <p>Please sign in to access this page.</p>
  <form on:submit|preventDefault>
    <label for='password'>Password:</label>
    <input name='password' type='password' bind:value={password}/>
    <button on:click={signIn}>Sign in</button>
  </form>

  {#if signingIn}
    <p style='color: blue;'>Signing in…</p>
  {/if}

  {#if errorMessage}
    <p style='color: red;'>❌️ {errorMessage}</p>
  {/if}
{:else}
  <p>Welcome to the admin page.</p>
  <form on:submit|preventDefault>
    <h2>General settings</h2>
    <label for='name'>Name</label>
    <input name='name' type='text' bind:value={hostDetails.name}/>

    <label for='domain'>Domain</label>
    <input name='domain' type='text' bind:value={hostDetails.domain}/>

    <label for='description'>Description</label>
    <textarea name='description' bind:value={hostDetails.description} />

    <label for='currency'>Currency</label> <span> & </span>
    <label id='priceLabel' for='price'>Price</label>
    <br>
    <input id='currency' name='currency' type='text' bind:value={hostDetails.currency}/>
    <input id='price' name='price' type='text' bind:value={hostDetails.price}/>

    <hr>

    <h2>DNS Settings</h2>

    <label for='dnsProvider'>Provider</label>
    <select name='dnsProvider'>
      <option value='DNSimple'>DNSimple</option>
    </select>

    <label id='accountIdLabel' for='dnsAccountId'>Account ID</label>
    <input class='inline' name='dnsAccountId' type='password' bind:value={hostDetails.dns.accountId} bind:this={dnsAccountId}/>
    <button on:click={toggle(dnsAccountId, this)}>Show</button>

    <label for='dnsZoneId'>Zone ID</label>
    <input class='inline' name='dnsZoneId' type='password' bind:value={hostDetails.dns.zoneId} bind:this={dnsZoneId}/>
    <button on:click={toggle(dnsZoneId, this)}>Show</button>

    <label for='dnsAccessToken'>Access Token</label>
    <input class='inline' name='dnsAccessToken' type='password' bind:value={hostDetails.dns.accessToken} bind:this={dnsAccessToken}/>
    <button on:click={toggle(dnsAccessToken, this)}>Show</button>

  </form>
{/if}


<style>
  input, textarea, select {
    display: block;
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  .inline {
    display: inline;
  }

  button + label, #accountIdLabel {
    display: block;
  }

  button {
    min-width: 4.5em;
  }

  #currency, #price {
    display: inline;
    width: 2em;
  }

</style>