<script>
  import { onMount } from 'svelte'

  // Using Dummy data for now.
  import { hostDetails } from '$lib/dummyData.js'

  let errorMessage = null
  let password = null
  let signingIn = false
  let signedIn = true
  let baseUrl

  let dnsAccountId
  let dnsZoneId
  let dnsAccessToken

  let vpsApiToken

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

    <label for='description'>Description</label>
    <textarea name='description' bind:value={hostDetails.description} />

    <hr>

    <h2>Payment Settings</h2>

    <label for='paymentProvider'>Provider</label>
    <select name='paymentProvider'>
      <option value='Stripe'>Stripe</option>
    </select>

    <label for='currency'>Currency</label> <span> & </span>
    <label id='priceLabel' for='price'>Price</label>
    <br>
    <input id='currency' name='currency' type='text' bind:value={hostDetails.payment.currency}/>
    <input id='price' name='price' type='text' bind:value={hostDetails.payment.price}/>

    <fieldset>
      <legend>Mode</legend>

      {#each hostDetails.payment.modes as mode}
        <label>
          <input class='inline' type=radio bind:group={hostDetails.payment.mode} value={mode}>
          {mode}
        </label>
      {/each}

    </fieldset>

    {#each hostDetails.payment.modeDetails as mode}
      <h3>{mode.title}</h3>
      <label for={`${mode.id}PublishableKey`}>Publishable key</label>
      <input id={`${mode.id}PublishableKey`} type='text' bind:value={mode.publishableKey}/>

      <label class='block' for={`${mode.id}SecretKey`}>Secret Key</label>
      <input class='inline' id={`${mode.id}SecretKey`} type='password' bind:value={mode.secretKey} bind:this={mode.input}/>
      <button on:click={toggle(mode.input, this)}>Show</button>

      <label for={`${mode.id}ProductId`}>Product ID</label>
      <input id={`${mode.id}ProductId`} type='text' bind:value={mode.productId}/>

      <label for={`${mode.id}PriceId`}>Price ID</label>
      <input id={`${mode.id}PriceId`} type='text' bind:value={mode.priceId}/>
    {/each}

    <hr>

    <h2>DNS Settings</h2>

    <label for='dnsProvider'>Provider</label>
    <select name='dnsProvider'>
      <option value='DNSimple'>DNSimple</option>
    </select>

    <label for='domain'>Domain</label>
    <input name='domain' type='text' bind:value={hostDetails.dns.domain}/>

    <label id='accountIdLabel' for='dnsAccountId'>Account ID</label>
    <input class='inline' name='dnsAccountId' type='password' bind:value={hostDetails.dns.accountId} bind:this={dnsAccountId}/>
    <button on:click={toggle(dnsAccountId, this)}>Show</button>

    <label for='dnsZoneId'>Zone ID</label>
    <input class='inline' name='dnsZoneId' type='password' bind:value={hostDetails.dns.zoneId} bind:this={dnsZoneId}/>
    <button on:click={toggle(dnsZoneId, this)}>Show</button>

    <label for='dnsAccessToken'>Access Token</label>
    <input class='inline' name='dnsAccessToken' type='password' bind:value={hostDetails.dns.accessToken} bind:this={dnsAccessToken}/>
    <button on:click={toggle(dnsAccessToken, this)}>Show</button>

    <hr>

    <h2>VPS Host Settings</h2>

    <label for='vpsProvider'>Provider</label>
    <select name='vpsProvider'>
      <option value='Hetzner'>Hetzner</option>
    </select>

    <label id='vpiApiTokenLabel' for='vpsApiToken'>API Token (with read/write permissions)</label>
    <input class='inline' name='vpsApiToken' type='password' bind:value={hostDetails.vps.apiToken} bind:this={vpsApiToken}/>
    <button on:click={toggle(vpsApiToken, this)}>Show</button>

    <h3>Server details</h3>
    <p>These settings will be used when setting up people’s servers.</p>

    <label for='vpsSshKeyName'>SSH Key Name</label>
    <input name='vpsSshKeyName' type='text' bind:value={hostDetails.vps.sshKeyName}/>

    <label for='vpsServerType'>Server Type</label>
    <input name='vpsServerType' type='text' bind:value={hostDetails.vps.serverType}/>

    <label for='vpsLocation'>Location</label>
    <input name='vpsLocation' type='text' bind:value={hostDetails.vps.location}/>

    <label for='vpsImage'>Image</label>
    <input name='vpsImage' type='text' bind:value={hostDetails.vps.image}/>

    <label for='vpsCloudInit'>Cloud Init</label>
    <textarea id='vpsCloudInit' name='vpsCloudInit' bind:value={hostDetails.vps.cloudInit} />

    <hr>

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

  .block {
    display: block;
  }

  button + label, #accountIdLabel, #vpiApiTokenLabel {
    display: block;
  }

  button {
    min-width: 4.5em;
  }

  #currency, #price {
    display: inline;
    width: 2em;
  }

  #vpsCloudInit {
    min-height: 300px;
  }

  fieldset {
    max-width: 10em;
  }

</style>