<script>
  // @hmr:keep-all

  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import StatusMessage from '$lib/StatusMessage.svelte'
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import DataProxy from '$lib/JSDB/DataProxy'
  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'
  import Jumper from '$lib/Jumper.svelte'
  import DomainChecker from '$lib/DomainChecker.svelte'
  import Switch from 'svelte-switch'
  import { Accordion, AccordionItem } from 'svelte-accessible-accordion'

  // Doing this in two-steps to the SvelteKit static adapter
  // doesn’t choke on it.
  import showdown from 'showdown'

  const { Converter } = showdown

  let settings = {}

  let shouldShowSavedMessage = false

  let errorMessage = null
  let password = null
  let signingIn = false
  let rebuildingSite = false

  // Outlets: DNSimple DNS settings
  let dnsDomainInput
  let dnsAccountIdInput
  let dnsAccessTokenInput

  let validateDnsError = null
  let validateVpsError = null

  let vpsDetails = {}
  let vpsServerType
  let vpsLocation
  let vpsImage
  let vpsSshKey
  let app = 0

  const PAYMENT_PROVIDERS = {
    none: 0,
    token: 1,
    stripe: 2
  }

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
    org: false,
    site: false,
    payment: false,
    dns: false,
    vps: false,
    apps: false
  }

  $: ok.all = ok.site && ok.payment && ok.dns && ok.vps && ok.apps

  $: if (signingIn) errorMessage = false
  $: if (rebuildingSite) socket.send(JSON.stringify({type: 'rebuild'}))

  $: ok.site = settings.site === undefined ? false : settings.site.name !== '' && settings.site.header !== '' && settings.site.footer !== ''

  $: ok.org = settings.org === undefined ? false : settings.org.name !== '' && settings.org.address !== '' && settings.org.site !== '' && settings.org.email !== ''

  $: ok.apps =settings.apps === undefined ? false : settings.apps.length > 0

  // Todo: include full list.
  const currencies = {
    'eur': '€',
    'gbp': '₤',
    'usd': '$'
  }

  onMount(() => {
    baseUrl = document.location.hostname
  })

  function createServer(event) {
    const domain = event.detail.domain
    socket.send(JSON.stringify({
      type: 'create-server',
      domain
    }))
  }

  function validateVps() {
    validateVpsError = null
    if (settings.vps.apiToken.length === 64) {
      socket.send(JSON.stringify({
        type: 'validate-vps'
      }))
    }
  }

  function validateDns() {
    validateDnsError = null
    if (
      settings.dns.domain !== ''
      && parseInt(settings.dns.accountId) !== NaN
      && settings.dns.accessToken !== ''
    ) {
      console.log('Validating DNS details…')
      socket.send(JSON.stringify({
        type: 'validate-dns'
      }))
    }
  }

  function validatePayment(modeId) {

    switch (settings.payment.provider) {
      case PAYMENT_PROVIDERS.none:
        // The None payment provider doesn’t have any
        // settings so it’s always valid.
        ok.payment = true
      break

      case PAYMENT_PROVIDERS.token:
        // TODO: Token payment type not implemented yet.
        ok.payment = false
      break

      case PAYMENT_PROVIDERS.stripe:
        gotPrice[modeId] = false
        priceError[modeId] = null

        const priceId = (settings.payment.providers[2].modeDetails[modeId === 'test' ? 0 : 1].priceId).trim()

        if (priceId === '') {
          return
        }

        if (
          !(
            (priceId.length === 1 && priceId === 'p') ||
            (priceId.length === 2 && priceId === 'pr') ||
            (priceId.length === 3 && priceId === 'pri') ||
            (priceId.length === 4 && priceId === 'pric') ||
            (priceId.length === 5 && priceId === 'price') ||
            (priceId.length >= 6 && priceId.startsWith('price_'))
          )
        ) {
          priceError[modeId] = 'That is not a valid price ID. It must start with price_'
          gotPrice[modeId] = true
          return
        }

        if (priceId.length !== 30) {
          priceError[modeId] = null
          gotPrice[modeId] = false
          return
        }

        console.log('Getting price…')
        socket.send(JSON.stringify({
          type: 'get-price',
          mode: modeId
        }))
        console.log(gotPrice, priceError)
      break
    }
  }

  function serverTypeChange () {
    settings.vps.serverType = vpsServerType.name
  }

  function vpsLocationChange () {
    settings.vps.location = vpsLocation.name
  }

  function vpsImageChange () {
    settings.vps.image = vpsImage.name
  }

  function vpsSshKeyChange () {
    settings.vps.sshKeyName = vpsSshKey.name
    settings.vps.sshKey = vpsSshKey.public_key
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
          validatePayment()
          validateDns()
          validateVps()
        break

        case 'price':
          settings.payment.providers[2].modeDetails[message.mode === 'test' ? 0 : 1].currency = currencies[message.currency]
          settings.payment.providers[2].modeDetails[message.mode === 'test' ? 0 : 1].amount = message.amount
          gotPrice[message.mode] = true
          priceError[message.mode] = null
          ok.payment = true
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

        case 'validate-dns-error':
          validateDnsError = message.error
          ok.dns = false
        break

        case 'validate-dns':
          validateDnsError = null
          ok.dns = true
        break

        case 'validate-vps-error':
          validateVpsError = message.error
          ok.vps = false
        break

        case 'validate-vps':
          validateVpsError = null
          vpsDetails = message.details

          const serverTypes = vpsDetails.serverTypes
          const locations = vpsDetails.locations
          const images = vpsDetails.images
          const sshKeys = vpsDetails.sshKeys

          vpsServerType = serverTypes.find(serverType => {
            return serverType.name === settings.vps.serverType
          })

          vpsLocation = locations.find(location => {
            return location.name === settings.vps.location
          })

          vpsImage = images.find(image => {
            return image.name === settings.vps.image
          })

          // FIX-ME: Unlike the others, initially this will be unset
          // ======= so we have to handle this differently. Test
          //         by removing SSH keys from Hetzner and starting
          //         with a blank slate.
          vpsSshKey = sshKeys.find(sshKey => {
            return sshKey.name === settings.vps.sshKeyName
          })

          ok.vps = true
        break

        default:
          console.error('Unknown message', message)
        break
      }
    }
  }
</script>

<main>
  <h1>Basil Administration</h1>

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
    <TabbedInterface>
      <TabList>
        <Tab><StatusMessage state={ok.all}>Setup</StatusMessage></Tab>
        <Tab>Places</Tab>
      </TabList>

      <TabPanel>
        <h2>Setup</h2>
        <p><strong><StatusMessage state={ok.all}>Your Small Web host {ok.all ? 'is fully configured and active' : 'needs configuration'}.</StatusMessage></strong></p>

        <TabbedInterface>
          <TabList>
            <Tab><StatusMessage state={ok.org}>Organisation</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.site}>Site</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.payment}>Payment</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.dns}>DNS</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.vps}>VPS</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.apps}>Apps</StatusMessage></Tab>
          </TabList>

          <form on:submit|preventDefault>

            <TabPanel>
              <h2 id='site'>Organisation settings</h2>
              <p>These details are used to populate the legal matter in the privacy policy and terms and conditions, etc. See Site.</p>

              <label for='orgName'>Name</label>
              <input name='orgName' type='text' bind:value={settings.org.name}/>

              <label for='orgName'>Official Address</label>
              <input name='orgName' type='text' bind:value={settings.org.address}/>

              <label for='orgSite'>Web site</label>
              <input name='orgSite' type='text' bind:value={settings.org.site}/>

              <label for='orgEmail'>Support email</label>
              <input name='orgEmail' type='text' bind:value={settings.org.email}/>

            </TabPanel>

            <TabPanel>
              <h2 id='site'>Site settings</h2>
              <p>The details here are used to render the page that people use to sign up to your hosting service.</p>

              <TabbedInterface>
                <TabList>
                  <Tab>Header</Tab>
                  <Tab>Footer</Tab>
                  <Tab>Privacy Policy</Tab>
                  <Tab>Terms and Conditions</Tab>
                </TabList>
                <TabPanel>
                  <label for='siteHeader'>Header</label>
                  <textarea name='siteHeader' bind:value={settings.site.header}/>
                  <small>You can use Markdown and HTML.</small>
                </TabPanel>
                <TabPanel>
                  <label for='siteFooter'>Footer</label>
                  <textarea name='siteFooter' bind:value={settings.site.footer}/>
                  <small>You can use Markdown and HTML.</small>
                </TabPanel>
              </TabbedInterface>

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
              <!-- svelte-ignore a11y-no-onchange -->
              <select name='paymentProvider' bind:value={settings.payment.provider} on:change={validatePayment}>
                {#each settings.payment.providers as provider, index}
                  <option value={index}>{provider.name}</option>
                {/each}
              </select>

              {#if settings.payment.provider === 0}
                <!-- None: no payment provider. All server setups must be done via the admin. -->
                <section class='instructions'>
                  <h3>Instructions </h3>
                  <p>You do not need to set up a payment method to use Basil. When no payment method is set, all server deployments must be done here, from the administrator. You still need to set up the DNS and VPS settings. This is a good option if you just want to set up servers for yourself or for you and your family and friends, for example.</p>
                </section>
              {/if}

              {#if settings.payment.provider === 1}
                <!-- Tokens -->
                <section class='instructions'>
                  <h3>Instructions </h3>
                  <p><strong>Not implemented yet:</strong> Tokens are an alternative to using regular currency, credit/debit card transactions to provide access to servers. A munipicality, for example, might decide that it is a human right for every one of its citizens to have their own place on the Small Web. In this case, a munipicality might decide to issue tokens to every resident that they can use when setting up their place. The same municipality may also activate Stripe payments for those who want more than one site, etc.</p>
                </section>
              {/if}

              {#if settings.payment.provider === 2}
                <!-- Stripe. -->
                <section class='instructions'>
                  <h3>Instructions</h3>

                  <ol>
                    <li>Get a <a href='https://stripe.com'>Stripe</a> account.</li>
                    <li>Accept your <a href='https://stripe.com/dpa/legal'>Data Processing Addendum</a> (GDPR). Download and print a copy, sign it and keep it safe.</li>
                    <li><a href='https://dashboard.stripe.com/products/create'>Create a new “recurring product”</a> e.g., <em>Small Web Hosting (monthly)</em></li>
                    <li>Enter the API ID of its price and other the details below.</li>
                  </ol>

                  <p><em>(Repeat Steps 3 and 4 once for Test Mode and once for Live Mode.)</em></p>
                </section>

                <label for='mode'>Mode</label>
                <Switch id='mode' on:change={event => settings.payment.providers[2].mode = event.detail.checked ? 'live' : 'test'} checked={settings.payment.providers[2].mode === 'live'} width=75>
                  <span class='live' slot='checkedIcon'>Live</span>
                  <span class='test' slot='unCheckedIcon'>Test</span>
                </Switch>

                <TabbedInterface>
                  <TabList>
                    {#each settings.payment.providers[2].modeDetails as mode}
                      <Tab>{mode.title}</Tab>
                    {/each}
                  </TabList>
                  {#each settings.payment.providers[2].modeDetails as mode}
                    <TabPanel>
                      <h3>{mode.title}</h3>
                      <label for={`${mode.id}PublishableKey`}>Publishable key</label>
                      <input id={`${mode.id}PublishableKey`} type='text' bind:value={mode.publishableKey} on:input={validatePayment(mode.id)}/>

                      <label class='block' for={`${mode.id}SecretKey`}>Secret Key</label>
                      <!-- TODO: Implement input event on SensitiveTextInput component. -->
                      <SensitiveTextInput name={`${mode.id}SecretKey`} bind:value={mode.secretKey} on:input={validatePayment(mode.id)}/>

                      <label for={`${mode.id}PriceId`}>Price (API ID)</label>
                      <input id={`${mode.id}PriceId`} type='text' bind:value={mode.priceId} on:input={validatePayment(mode.id)}/>

                      {#if gotPrice[mode.id] && priceError[mode.id] !== null}
                        <p style='color: red;'>❌️ {priceError[mode.id]}</p>
                      {:else if gotPrice[mode.id]}
                        <p>✔️ Based on your Stripe {mode.id} mode product settings, your hosting price is set for <strong>{mode.currency}{mode.amount}/month.</p>
                      {:else}
                        <p>ℹ️ <em>Waiting for a valid Stripe price API ID in the form <code>price_[24 chars]</code> before validating these details.</em></p>
                      {/if}
                    </TabPanel>
                  {/each}
                </TabbedInterface>
              {/if}
            </TabPanel>

            <TabPanel>
              <h2 id='dns'>DNS Settings</h2>

              <label for='dnsProvider'>Provider</label>
              <select name='dnsProvider'>
                <option value='DNSimple'>DNSimple</option>
              </select>

              <section class='instructions'>
                <h3>Instructions</h3>
                <ol>
                  <li>Get a <a href='https://dnsimple.com'>DNSimple</a> account (a personal account should suffice as you only need to add subdomains to one domain).</li>
                  <li><strong>DNSimple does not provide GDPR Data Protection Agreements for anything less than their $300/mo business accounts.</strong> They say one is not necessary for hosting subdomains. (see <a href='https://blog.dnsimple.com/2018/05/gdpr/'>GDPR at DNSimple</a>, <a href='https://dnsimple.com/privacy'>DNSimple Privacy Policy</a>).</li>
                  <li>Add your domain to your DNSimple dashboard and find the details required on it under <strong>Account → Automation</strong>.</li>
                </ol>
              </section>

              {#if validateDnsError}
                <p style='color: red;'>❌️ {validateDnsError}</p>
              {:else if ok.dns}
                <p>✔️ Your DNS settings are correct.</p>
              {:else}
                <p>You’ll be informed once you have the correct details set.</p>
              {/if}

              <label for='domain'>Domain</label>
              <input
                id='domain'
                name='domain'
                type='text'
                bind:value={settings.dns.domain}
                bind:this={dnsDomainInput}
                on:input={validateDns}
              />

              <label id='accountIdLabel' for='dnsAccountId'>Account ID</label>
              <SensitiveTextInput
                name='dnsAccountId'
                bind:value={settings.dns.accountId}
                bind:this={dnsAccountIdInput}
                on:input={validateDns}
              />

              <label for='dnsAccessToken' class='block'>Access Token</label>
              <SensitiveTextInput
                name='dnsAccessToken'
                bind:value={settings.dns.accessToken}
                bind:this={dnsAccessTokenInput}
                on:input={validateDns}
              />
            </TabPanel>

            <TabPanel>
              <h2 id='vps'>VPS Host Settings</h2>

              <label for='vpsProvider'>Provider</label>
              <select name='vpsProvider'>
                <option value='Hetzner'>Hetzner</option>
              </select>

              <section class='instructions'>
                <h3>Instructions</h3>
                <ol>
                  <li>Create a <a href='https://www.hetzner.com/cloud'>Hetzner Cloud</a> account.</li>
                  <li><a href='https://accounts.hetzner.com/account/dpa'>Create a GDPR Data Protection Agreement</a>, accept it, download a copy, sign it, and keep it somewhere safe. (See <a href='https://docs.hetzner.com/general/general-terms-and-conditions/data-privacy-faq/'>Hetzner Data Privacy FAQ</a>)</li>
                  <li><a href='https://console.hetzner.cloud/projects'>Create a new project</a> to hold the sites you will be hosting.</li>
                  <li>Generate an API Token from <strong><em>your-project</em> → Security → API Tokens</strong> in your Hetzner dashboard and copy it below.</li>
                </ol>
              </section>

              {#if validateVpsError}
                <p style='color: red;'>❌️ {validateVpsError}</p>
              {:else if ok.vps}
                <p>✔️ Your VPS settings are correct.</p>
              {:else}
                <p>You’ll be informed once you have the correct details set.</p>
              {/if}

              <label id='vpiApiTokenLabel' for='vpsApiToken'>API Token (with read/write permissions)</label>
              <SensitiveTextInput
                name='vpsApiToken'
                bind:value={settings.vps.apiToken}
                on:input={validateVps}
              />

              {#if ok.vps}
                <!-- SSH keys -->
                <label for='vpsSshKey'>SSH Key Name</label>
                <!-- svelte-ignore a11y-no-onchange -->
                <select id='vpsSshKey' bind:value={vpsSshKey} on:change={vpsSshKeyChange}>
                  {#each vpsDetails.sshKeys as sshKey}
                    <option value={sshKey}>{sshKey.name}</option>
                  {/each}
                </select>
                <ul class='vpsItemDetails'>
                  <li>Created: {vpsSshKey.created}</li>
                  <li>Fingerprint: {vpsSshKey.fingerprint}</li>
                  <li>Public Key: <code>{vpsSshKey.public_key}</code></li>
                </ul>

                <Accordion>
                  <AccordionItem title='Advanced'>
                    <h3>Server details</h3>
                    <p>These settings will be used when setting up servers.</p>

                    <!-- VPS Server Types -->
                    <label for='vpsServerType'>Server type</label>
                    <!-- svelte-ignore a11y-no-onchange -->
                    <select id='vpsServerType' bind:value={vpsServerType} on:change={serverTypeChange}>
                      {#each vpsDetails.serverTypes as serverType}
                        <option value={serverType}>{serverType.description}</option>
                      {/each}
                    </select>
                    <p class='vpsItemDetails'>{vpsServerType.cores} cores, {vpsServerType.memory}GB memory, {vpsServerType.disk}GB disk. Cost: €{parseFloat(vpsServerType.prices[0].price_monthly.net).toFixed(2)}/month (exc. VAT).</p>

                    <!-- VPS Locations -->
                    <label for='vpsLocation'>Location</label>
                    <!-- svelte-ignore a11y-no-onchange -->
                    <select id='vpsLocation' bind:value={vpsLocation} on:change={vpsLocationChange}>
                      {#each vpsDetails.locations as location}
                        <option value={location}>{location.description.replace('DC', 'Data Centre')}</option>
                      {/each}
                    </select>
                    <p class='vpsItemDetails'>{vpsLocation.city} ({vpsLocation.country}), {vpsLocation.network_zone.replace('eu-central', 'central EU')} network zone.</p>

                    <!-- VPS Images -->
                    <label for='vpsImage'>Image</label>
                    <!-- svelte-ignore a11y-no-onchange -->
                    <select id='vpsImage' bind:value={vpsImage} on:change={vpsImageChange}>
                      {#each vpsDetails.images as image}
                        <option value={image}>{image.description}</option>
                      {/each}
                    </select>
                    <p class='vpsItemDetails'>
                      {#if vpsImage.name === 'ubuntu-20.04'}
                        <strong class='positive'>This is currently the only supported system for Small Web deployments.</strong>
                      {:else}
                        <strong class='warning'>This is an unsupported system for Small Web deployments.</strong>
                      {/if}
                        Any Linux with systemd should work but you might have to adjust the Cloud Init script, below.
                    </p>
                  </AccordionItem>
                </Accordion>
              {/if}
            </TabPanel>
            <TabPanel>
              <h2>App Settings</h2>

              <label for='app'>App</label>
              <select id='app' bind:value={app}>
                {#each settings.apps as app, index}
                  <option value={index}>{app.name}</option>
                {/each}
              </select>

              <label for='appName'>Name</label>
              <input
                id='appName'
                name='appName'
                type='text'
                bind:value={settings.apps[app].name}
              />

              <label for='appDescription'>Description</label>
              <textarea id='appDescription' name='appDescription' bind:value={settings.apps[app].description} />

              <label for='appLogo'>Logo (SVG)</label>

              <div>
                <div class='appLogo'>{@html settings.apps[app].logo}</div>
                <div class='appLogo'>{@html settings.apps[app].logo}</div>
                <div class='appLogo'>{@html settings.apps[app].logo}</div>
                <div class='appLogo'>{@html settings.apps[app].logo}</div>
                <div class='appLogo'>{@html settings.apps[app].logo}</div>
              </div>

              <textarea id='appLogo' name='appLogo' bind:value={settings.apps[app].logo} />

              <label for='appCloudInit'>Cloud Init</label>
              <p>Please only change the Cloud Init configuration if you know what you’re doing.</p>
              <textarea id='appCloudInit' name='appCloudInit' bind:value={settings.apps[app].cloudInit} />

            </TabPanel>
          </form>

        </TabbedInterface>
      </TabPanel>

      <TabPanel>
        <h2>Places</h2>
        <h3>Create a new Small Web place</h3>
        <p>You can create a new place without requiring payment details from here (e.g., for your own organisation, for friends, etc.)</p>
        <DomainChecker
          config={settings}
          buttonLabel='Create server'
          on:create={createServer}
        />

        <h3>Hosted places</h3>
        <p>This is the list of Small Web places that are currently being hosted by you.</p>
        <p><strong>Nothing yet.</strong></p>
      </TabPanel>
    </TabbedInterface>
    {#if shouldShowSavedMessage}
      <div id='saved' transition:fade={{duration: 500}} tabindex='-1'>Auto-saved</div>
    {/if}
  {/if}
</main>


<style>
  main {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

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

  *:global(.appLogo) {
    display: inline-block;
  }

  *:global(.appLogo svg) {
    border: 1px solid black;
    padding: 1em;
    width: 3em;
    height: 3em;
    vertical-align: middle;
  }

  /* Show the logo in various colours and also inverted
     to underscore its nature. */

  *:global(.appLogo:nth-of-type(2) svg) {
    color: white;
    background-color: black;
  }

  /* Colours courtesy of: https://cssgradient.io/ */

  *:global(.appLogo:nth-of-type(3) svg) {
    color: #FF033E; /* American rose. */
  }

  *:global(.appLogo:nth-of-type(4) svg) {
    color: #006A4E; /* Bottle green. */
  }

  *:global(.appLogo:nth-of-type(5) svg) {
    color: #6CB4EE; /* Argentine blue. */
  }

  .inline {
    display: inline;
  }

  .block {
    display: block;
  }

  .positive {
    color: green;
  }

  .warning {
    color: orange;
  }

  .negative {
    color: red;
  }

  .live, .test {
		color: white;
		display: inline-block;
		margin-top: 0.1em;
	}

	.live {
		margin-left: 0.75em;
	}

  .instructions {
    background-color: #eee;
    margin-left: -1em;
    padding-left: 1em;
    margin-right: -1em;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    padding-right: 1em;
    padding-top: 0.25em;
    padding-bottom: 0.5em;
    border-radius: 1em;
  }

  .instructions li {
    margin-top: 0.5em;
  }

  .vpsItemDetails {
    margin-top: -0.75em;
    font-size: smaller;
    font-style: italic;
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

  #currency, #price {
    display: inline;
    width: 2em;
  }

  :global([data-accordion]) {
    list-style: none;
    margin:0;
    padding: 0;
  }

  :global([data-accordion-item] button) {
    border: 0;
    background: none;
    font: inherit;
    font-size: 1.25em;
    font-weight: bold;
    line-height: inherit;
    color: inherit;
    cursor: pointer;
    width: 100%;
    text-align: left;
    margin: 0;
    padding: 0;
    padding-bottom: 0.75em;
    border-radius: 0;
    margin-top: 0.25em;
    border-bottom: 2px dashed grey;
  }

  :global([data-accordion-item] button[aria-expanded='false']::before) {
    content: ' ⯈ '
  }

  :global([data-accordion-item] button[aria-expanded='true']::before) {
    content: ' ⯆ '
  }

  :global([data-accordion-item] [role="region"]) {
    /* background-color: #eee; */
    /* margin: -0.25em -1em; */
    /* padding: 0.25em 1em; */
	}

  #appLogo, #appCloudInit {
    min-height: 420px;
  }

  #appDescription {
    min-height: 100px;
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
