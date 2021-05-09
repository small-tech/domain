<script>
  // @hmr:keep-all

  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import StatusMessage from '$lib/StatusMessage.svelte'
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import DataProxy from '$lib/JSDB/DataProxy'
  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'
  import Jumper from '$lib/Jumper.svelte'
  import Switch from 'svelte-switch'

  // Doing this in two-steps to the SvelteKit static adapter
  // doesn’t choke on it.
  import showdown from 'showdown'
import Index from './index.svelte'
  const { Converter } = showdown

  let settings = {}

  let shouldShowSavedMessage = false

  let errorMessage = null
  let password = null
  let signingIn = false
  let rebuildingSite = false

  const gotPrice = {
    test: false,
    live: false
  }
  const priceError = {
    test: null,
    live: null
  }

  let signedIn = false

  let baseUrl

  let socket

  const converter = new Converter()

  const ok = {
    all: false,
    site: false,
    payment: false,
    dns: false,
    vps: false
  }

  $: if (signingIn) errorMessage = false
  $: if (rebuildingSite) socket.send(JSON.stringify({type: 'rebuild'}))

  $: ok.site = settings.site === undefined ? false : settings.site.name !== '' && settings.site.header !== '' && settings.site.footer !== ''

  // Todo: include full list.
  const currencies = {
    'eur': '€',
    'gbp': '₤',
    'usd': '$'
  }

  onMount(() => {
    baseUrl = document.location.hostname
  })

  function getPrice(modeId) {
    gotPrice[modeId] = false
    priceError[modeId] = null

    const priceId = settings.payment.modeDetails[modeId === 'test' ? 0 : 1].priceId

    if (priceId === '') {
      return
    }

    if (!priceId.startsWith('p') || !priceId.startsWith('pr') || !priceId.startsWith('pri') || !priceId.startsWith('pric') || !priceId.startsWith('price') || !priceId.startsWith('price_')) {
      priceError[modeId] = 'That is not a valid price ID. It must start with price_'
      gotPrice[modeId] = true
      return
    }

    console.log('Getting price…')
    socket.send(JSON.stringify({
      type: 'get-price',
      mode: modeId
    }))
    console.log(gotPrice, priceError)
  }

  function showSavedMessage() {
    if (shouldShowSavedMessage) return
    shouldShowSavedMessage = true
    setTimeout(() => shouldShowSavedMessage = false, 1500)
  }

  async function signIn () {
    signingIn = true
    try {
      socket = new WebSocket(`wss://${baseUrl}/admin/socket/${password}`)
    } catch (error) {
      errorMessage = `WebSocket ${error}.`
      signingIn = false
      return
    }

    socket.onopen = () => {
      console.log('Socket open.')
    }

    socket.onerror = event => {
      errorMessage = 'WebSocket connection failed (<strong>is Site.js running?</strong>)'
      signingIn = false
    }

    socket.onclose = event => {
      signingIn = false
      signedIn = false
      console.log(`Socket closed.`)
    }

    socket.onmessage = event => {
      const message = JSON.parse(event.data)
      switch (message.type) {
        case 'settings':
          settings = DataProxy.createDeepProxy(
            {
              persistChange: change => {
                // console.log('Persist', change)
                showSavedMessage()
                socket.send(JSON.stringify({
                  type: 'update',
                  keyPath: change.keyPath,
                  value: change.value
                }))
              }
          }, message.body, 'settings')
          signingIn = false
          signedIn = true
          getPrice('test')
          getPrice('live')
        break

        case 'price':
          console.log(`Price: ${message.amount}, ${message.currency}`)
          console.log(message)
          settings.payment.modeDetails[message.mode === 'test' ? 0 : 1].currency = currencies[message.currency]
          settings.payment.modeDetails[message.mode === 'test' ? 0 : 1].amount = message.amount
          gotPrice[message.mode] = true
          console.log(gotPrice)
        break

        case 'error':
          errorMessage = message.body
        break

        case 'price-error':
          if (message.error.param === 'price' && message.error.type === 'invalid_request_error') {
            priceError[message.mode] = 'No price exists with that API ID.'
          } else {
            priceError[message.mode] = `${message.error.message} (${message.error.type})`
          }
          gotPrice[message.mode] = true
        break

        default:
          console.error('Unknown message', message)
        break
      }
    }
  }
</script>

<h1>Basil Settings</h1>

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
    <p style='color: red;'>❌️ {@html errorMessage}</p>
  {/if}
{:else}
  <h2>Status</h2>

  <p><strong><StatusMessage state={ok.all}>Your Small Web host {ok.all ? 'is fully configured and active' : 'needs configuration'}.</StatusMessage></strong></p>

  <TabbedInterface>
    <TabList>
      <Tab><StatusMessage state={ok.site}>Site</StatusMessage></Tab>
      <Tab><StatusMessage state={ok.payment}>Payment</StatusMessage></Tab>
      <Tab><StatusMessage state={ok.dns}>DNS</StatusMessage></Tab>
      <Tab><StatusMessage state={ok.vps}>VPS</StatusMessage></Tab>
    </TabList>

    <form on:submit|preventDefault>

      <TabPanel>
        <h2 id='site'>Site settings</h2>
        <label for='siteName'>Name</label>
        <input name='siteName' type='text' bind:value={settings.site.name}/>

        <label for='siteHeader'>Header</label>
        <textarea name='siteHeader' bind:value={settings.site.header}/>

        <label for='siteFooter'>Footer</label>
        <textarea name='siteFooter' bind:value={settings.site.footer}/>
        <small>You can use Markdown and HTML.</small>

        <div id='preview' class='site'>
          <h3>Preview</h3>
          <!-- <h1>{settings.site.name}</h1> -->
          {@html converter.makeHtml(settings.site.header)}
          <strong>[Sign-Up Module Goes Here]</strong>
          {@html converter.makeHtml(settings.site.footer)}
        </div>

        <p><em>Your changes are automatically saved in the database but the static site is not automatically rebuilt for you. Either run <code>npm run build</code> from the command-line manually or use the button below to regenerate your site to match the above preview.</em></p>

        <button
          id='rebuildSiteButton'
          disabled={rebuildingSite}
          on:click|preventDefault={() => rebuildingSite = true}
        >
            Rebuild site
        </button>

        {#if rebuildingSite}
          <div id='rebuildSiteProgressIndicator'><Jumper size=1.5 unit=em color=green/> Rebuilding site…</div>
        {/if}
      </TabPanel>

      <TabPanel>
        <h2 id='payment'>Payment Settings</h2>

        <label for='paymentProvider'>Provider</label>
        <select name='paymentProvider'>
          <option value='Stripe'>Stripe</option>
        </select>

        <!-- Stripe (currently the only implemented provider)-->

        <section id='stripeInstructions'>
          <h3>Instructions</h3>

          <ol>
            <li>Get a <a href='https://stripe.com'>Stripe</a> account.</li>
            <li><a href='https://dashboard.stripe.com/products/create'>Create a new “recurring product”</a> e.g., <em>Small Web Hosting (monthly)</em></li>
            <li>Enter the API ID of its price and other the details below.</li>
          </ol>

          <p><em>(Repeat Steps 2 and 3 once for Test Mode and once for Live Mode.)</em></p>
        </section>

        <!-- Note: this will be automatically received via the Stripe API. -->
        <!-- <label for='currency'>Currency</label> <span> & </span>
        <label id='priceLabel' for='price'>Price</label>
        <br>
        <input id='currency' name='currency' type='text' bind:value={settings.payment.currency}/>
        <input id='price' name='price' type='text' bind:value={settings.payment.price}/> -->

        <label for='mode'>Mode</label>
        <Switch id='mode' on:change={event => settings.payment.mode = event.detail.checked ? 'live' : 'test'} checked={settings.payment.mode === 'live'} width=75>
          <span class='live' slot='checkedIcon'>Live</span>
          <span class='test' slot='unCheckedIcon'>Test</span>
        </Switch>

        <TabbedInterface>
          <TabList>
            {#each settings.payment.modeDetails as mode}
              <Tab>{mode.title}</Tab>
            {/each}
          </TabList>
          {#each settings.payment.modeDetails as mode}
            <TabPanel>
              <h3>{mode.title}</h3>
              <label for={`${mode.id}PublishableKey`}>Publishable key</label>
              <input id={`${mode.id}PublishableKey`} type='text' bind:value={mode.publishableKey}/>

              <label class='block' for={`${mode.id}SecretKey`}>Secret Key</label>
              <SensitiveTextInput name={`${mode.id}SecretKey`} bind:value={mode.secretKey} />

              <label for={`${mode.id}PriceId`}>Price (API ID)</label>
              <input id={`${mode.id}PriceId`} type='text' bind:value={mode.priceId} on:input={getPrice(mode.id)}/>

              {#if gotPrice[mode.id] && priceError[mode.id] !== null}
                <p style='color: red;'>❌️ {priceError[mode.id]}</p>
              {:else if gotPrice[mode.id]}
                <p>✔️ Based on your Stripe {mode.id} mode product settings, your hosting price is set for <strong>{mode.currency}{mode.amount}/month.</p>
              {/if}
            </TabPanel>
          {/each}
          </TabbedInterface>
      </TabPanel>

      <TabPanel>
        <h2 id='dns'>DNS Settings</h2>

        <label for='dnsProvider'>Provider</label>
        <select name='dnsProvider'>
          <option value='DNSimple'>DNSimple</option>
        </select>

        <label for='domain'>Domain</label>
        <input name='domain' type='text' bind:value={settings.dns.domain}/>

        <label id='accountIdLabel' for='dnsAccountId'>Account ID</label>
        <SensitiveTextInput name='dnsAccountId' bind:value={settings.dns.accountId} />

        <label for='dnsZoneId' class='block'>Zone ID</label>
        <SensitiveTextInput name='dnsZoneId' bind:value={settings.dns.zoneId} />

        <label for='dnsAccessToken' class='block'>Access Token</label>
        <SensitiveTextInput name='dnsAccessToken' bind:value={settings.dns.accessToken} />
      </TabPanel>

      <TabPanel>
        <h2 id='vps'>VPS Host Settings</h2>

        <label for='vpsProvider'>Provider</label>
        <select name='vpsProvider'>
          <option value='Hetzner'>Hetzner</option>
        </select>

        <label id='vpiApiTokenLabel' for='vpsApiToken'>API Token (with read/write permissions)</label>
        <SensitiveTextInput name='vpsApiToken' bind:value={settings.vps.apiToken}/>

        <h3>Server details</h3>
        <p>These settings will be used when setting up people’s servers.</p>

        <label for='vpsSshKeyName'>SSH Key Name</label>
        <input name='vpsSshKeyName' type='text' bind:value={settings.vps.sshKeyName}/>

        <label for='vpsServerType'>Server Type</label>
        <input name='vpsServerType' type='text' bind:value={settings.vps.serverType}/>

        <label for='vpsLocation'>Location</label>
        <input name='vpsLocation' type='text' bind:value={settings.vps.location}/>

        <label for='vpsImage'>Image</label>
        <input name='vpsImage' type='text' bind:value={settings.vps.image}/>

        <label for='vpsCloudInit'>Cloud Init</label>
        <textarea id='vpsCloudInit' name='vpsCloudInit' bind:value={settings.vps.cloudInit} />
      </TabPanel>

    </form>

  </TabbedInterface>

  {#if shouldShowSavedMessage}
    <div id='saved' transition:fade={{duration: 500}} tabindex='-1'>Auto-saved</div>
  {/if}
{/if}


<style>
  input, textarea, select {
    display: block;
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    min-height: 200px;
  }

  textarea + small {
    display: block;
    margin-top: -0.5em;
    font-style: italic;
  }

  label {
    margin-bottom: 0.5em;
  }

  label[for=mode] {
    display: block;
    margin-bottom: 0;
  }

  :global(label[for=mode] + div) {
    margin-bottom: 1em;
  }

  .inline {
    display: inline;
  }

  .block {
    display: block;
  }

  .live, .test {
		color: white;
		display: inline-block;
		margin-top: 0.1em;
	}

	.live {
		margin-left: 0.75em;
	}

  #accountIdLabel, #vpiApiTokenLabel {
    display: block;
  }

  button {
    min-width: 4.5em;
  }

  fieldset {
    max-width: 10em;
  }

  #rebuildSiteButton {
    display: block;
    min-width: 10em;
    margin-left: auto;
    margin-right: auto;
  }

  *:global(#rebuildSiteButton:disabled) {
    background: lightgray;
    color: gray;
  }

  #rebuildSiteProgressIndicator {
    position: fixed;
    right: 1em;
    top: 0.5em;
    background: lightgray;
    padding: 1em;
    border-radius: 3em;
    box-shadow: grey 1px 1px 4px;
  }

  #stripeInstructions {
    background-color: #eee;
    margin-left: -1em;
    padding-left: 1em;
    margin-right: -1em;
    padding-right: 1em;
    padding-top: 0.25em;
    padding-bottom: 0.5em;
    border-radius: 1em;
  }

  #currency, #price {
    display: inline;
    width: 2em;
  }

  #vpsCloudInit {
    min-height: 300px;
  }

  #saved {
    position: fixed;
    right: 1em;
    top: 1em;
    text-align: center;
    padding: 0.15em 1em;
    background-color: green;
    border-radius: 1em;
    color: white;
  }

  #preview {
    border: 1px solid black;
    padding: 1em;
    margin-top: 1.5em;
  }

  #preview h3 {
    margin-top: 0;
    background-color: black;
    color: white;
    padding-left: 0.9em;
    margin-top: -0.9em;
    margin-left: -0.9em;
    margin-right: -0.9em;
  }
</style>
