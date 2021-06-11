<script context='module'>
  export async function load({page, fetch}) {
    const response = await fetch('ssr/config')

    if (response.status !== 200) {
      const details = await response.text()

      return {
        props: {
          serverError: {
            details
          },
          config: {site: {}, dns: {}, payment: {}, psl: {}}
        }
      }
    }

    const config = await (response).json()
    return {
      props: {
        config
      }
    }
  }
</script>

<script>
  // @hmr:keep-all

  import { onMount } from 'svelte'
  import { fade, scale } from 'svelte/transition'
  import StatusMessage from '$lib/StatusMessage.svelte'
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import DataProxy from '$lib/JSDB/DataProxy'
  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'
  import Jumper from '$lib/Jumper.svelte'
  import DomainChecker from '$lib/DomainChecker.svelte'
  import Modal from '$lib/Modal.svelte'
  import Switch from 'svelte-switch'
  import { Accordion, AccordionItem } from 'svelte-accessible-accordion'
  import { Checkbox } from '$lib/Checkbox'
  import { getPublicKeysHex } from '$lib/keys.js'
  import { tweened } from 'svelte/motion'
  import { cubicOut } from 'svelte/easing'
  import EFFDicewarePassphrase from '@small-tech/eff-diceware-passphrase'

  import Organisation from '$lib/admin/Organisation.svelte'
  import Apps from '$lib/admin/Apps.svelte'
  import PSL from '$lib/admin/PSL.svelte'
  import DNS from '$lib/admin/DNS.svelte'

  import {
    additionalCurrenciesSupportedInUnitedArabEmirates,
    currencyDetailsForCurrencyCode,
    alphabeticallySortedCurrencyDetails,
    minimumChargeAmountsInWholeCurrencyUnits,
    minimumChargeAmountsInWholeStripeUnits
  } from '$lib/StripeCurrencies.js'

  // Implement global Buffer support.
  import { Buffer } from 'buffer'
  globalThis.Buffer = Buffer

  export let config

  let mounted = false
  let settings

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
  let validatePslError = null

  let vpsDetails = {}
  let vpsServerType
  let vpsLocation
  let vpsImage
  let vpsSshKey

  let appToCreate = 0
  let domainToCreate = ''
  let newSiteUrl

  let creatingSite = false
  let showSiteCreationModal = false

  let siteCreationSucceeded = false
  let siteCreationFailed = false
  let siteCreationEnded = false

  let serverCreationStep = 0

  let serverCreated = false
  let domainNameRegistered = false
  let serverInitialised = false
  let appInstalled = false
  let appRunning = false
  let securityCertificateReady = false
  let serverResponseReceived = false

  let newPlacePassphrase
  let passphraseSavedCheck = false
  let agreeToTerms = false

  let stripePrice = 10
  let previousStripePrice = stripePrice
  let formattedMinimumPrice
  let stripeCurrency
  let stripeCurrencyOnlyValidInUnitedArabEmirates = false
  let minimumStripePriceForCurrency = 1

  // Actual progress timings from Hetzner API.
  let serverInitialisationProgress = tweened(0, {
    duration: 333,
    easing: cubicOut
  })

  // Simulated progress timings for app install and app run.
  let appInstallProgress = tweened(0, {
    duration: 5000,
    easing: cubicOut
  })

  let appRunProgress = tweened(0, {
    duration: 8000,
    easing: cubicOut
  })

  let certificateProvisioningProgress = tweened(0, {
    duration: 10000,
    easing: cubicOut
  })

  $: siteCreationEnded = siteCreationSucceeded || siteCreationFailed

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

  let isOnPublicSuffixList = false
  let signedIn = false
  let baseUrl
  let socket

  const ok = {
    all: false,
    org: false,
    apps: false,
    psl: false,
    dns: false,
    vps: false,
    payment: false
  }

  $: ok.all = ok.org && ok.payment && ok.dns && ok.vps && ok.apps

  $: if (signingIn) errorMessage = false
  $: if (rebuildingSite) socket.send(JSON.stringify({type: 'rebuild'}))

  $: ok.org = settings === undefined ? false : settings.org.name !== '' && settings.org.address !== '' && settings.org.site !== '' && settings.org.email !== ''

  $: ok.apps = settings === undefined ? false : settings.apps.length > 0

  $: ok.psl = settings === undefined ? false : settings.payment.provider === PAYMENT_PROVIDERS.none || isOnPublicSuffixList

  $: stripeCurrencyOnlyValidInUnitedArabEmirates = additionalCurrenciesSupportedInUnitedArabEmirates.includes(stripeCurrency)

  // TODO: Implement this in index and then remove from here.
  // $: {
  //   if (stripeCurrency) {
  //     const currencyDetails = currencyDetailsForCurrencyCode(stripeCurrency)
  //     let output = currencyDetails.template
  //     output = output.replace('$', currencyDetails.symbol)
  //     output = output.replace('1', minimumStripePriceForCurrency)
  //     formattedMinimumPrice = output
  //   }
  // }

  onMount(async () => {
    baseUrl = document.location.hostname

    const generate = new EFFDicewarePassphrase()
    newPlacePassphrase = generate.entropy(100).join(' ')
    mounted = true
  })

  const duration = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  async function createServer(event) {
    domainToCreate = event.detail.domain

    const publicKeys = await getPublicKeysHex(domainToCreate, newPlacePassphrase)

    console.log('Public keys (hex)', publicKeys)

    socket.send(JSON.stringify({
      type: 'create-server',
      domain: domainToCreate,
      app: appToCreate,
      publicKeys
    }))

    // Show the progress modal.
    // (It will be updated when we get progress messages from the server.)

    siteCreationSucceeded = false
    siteCreationFailed = false
    creatingSite = true
    showSiteCreationModal = true
    serverCreationStep++
  }

  // Custom validation because the built-in browser form validation is useless.
  // This simply does not allow an invalid value to be entered.
  function validateStripePriceOnInput (event) {
    const price = event.target.value
    if (price < 1 || parseInt(price) === NaN) {
      // On input, do not force the validation so people
      // can create temporarily invalid enties (e.g., when deleting an existing
      // number)
      return
    } else {
      previousStripePrice = stripePrice
    }
  }

  // On change, actually force the value to be correct.
  function validateStripePriceOnChange (event) {
    const price = event.target.value
    if (price < 1 || parseInt(price) === NaN) {
      stripePrice = previousStripePrice
    }
  }

  function validatePsl() {
    if (settings.payment.provider === PAYMENT_PROVIDERS.none) {
      // Domain does not need to be on the Public Suffix List for private instances.
      return true
    }
    socket.send(JSON.stringify({
      type: 'validate-psl'
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

    socket.onmessage = async event => {
      const message = JSON.parse(event.data)
      switch (message.type) {

        case 'create-server-progress':

          switch (message.subject) {
            case 'vps':
              if (message.status === 'initialising') {
                serverCreated = true
                await duration(700)
                serverCreationStep++
              } else if (message.status === 'running') {
                serverInitialisationProgress.set(message.progress)
              } else {
                console.log('Warning: received unexpected status for create-server-progress subject VPS:', message.status)
              }
            break

            case 'dns':
              if (message.status === 'initialising') {
                domainNameRegistered = true
                await duration(700)
                serverCreationStep++
              } else {
                console.log('Warning: received unexpected status for create-server-progress subject DNS:', message.status)
              }
            break

            default:
              console.log('Warning: unexpected create-server-progress subject received', message.subject)
          }
        break

        case 'create-server-success':
          if (message.status === 'done') {
            serverInitialised = true
            await duration(700)
            serverCreationStep++

            // From here, we simulate progress for the app install and app run staged based on
            // actual timings taken from the same server configuration. There will be some variance and
            // that’s why we wait for an actual response from the server at the end of the process.
            // In the future, we might add an API to Site.js that sends progress information back so
            // we can have more precise timings but this should, for the time being and for the
            // supported apps, give us adequate timings/progress to within a couple of seconds.

            // Wait for app install.

            // Installing Site.js (the only supported app at the moment) takes on average 4 seconds,
            // min: 2.995 seconds, max: 5.54 seconds. Sample size: 10 runs.
            // To be on the safe side, let’s keep this at 5 seconds.
            appInstallProgress.set(1)
            await duration(5000)
            appInstalled = true

            await duration(700) // Wait for Checkbox animation to end.
            serverCreationStep++

            // Running site enable takes ~2-3 seconds.
            // For Owncast, it takes longer as it has to download, install and run owncast (I have
            // two timings so far: 7.4578 seconds and 9.046 seconds; average: 8.312 seconds).
            //
            // TODO: this is currently hard-coded for Site.js Owncast install. At least use the
            // ===== right duration when running just Site.js.
            appRunProgress.set(1)
            await duration(8500)
            appRunning = true

            await duration(700) // Wait for Checkbox animation to end.
            serverCreationStep++

            certificateProvisioningProgress.set(1)
            await duration(10000)
            securityCertificateReady = true

            await duration(700) // Wait for Checkbox animation to end.
            serverCreationStep++

            // Now we actually start polling the server to see if it is ready.
            socket.send(JSON.stringify({
              type: 'wait-for-server-response',
              domain: domainToCreate
            }))

            newSiteUrl = `https://${domainToCreate}.${settings.dns.domain}`

            // TODO: set the Visit button URL to new site’s URL.
          } else {
            console.log('Warning: received unexpected status for create-server-success subject task:', message.status)
          }
        break

        case 'server-response-received':
          // OK, server is ready!
          serverResponseReceived = true

          await duration(700) // Wait for Checkbox animation to end.
          serverCreationStep++

          siteCreationSucceeded = true
          creatingSite = false

          // TODO: Once the progress modal has been closed, make sure we
          // ===== reset serverCreationStep, etc.
          //       (Even better, pull out the progress modal into its own component)
        break

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
          validatePsl()
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

        case 'validate-psl':
          isOnPublicSuffixList = true
          ok.psl = true
        break

        case 'validate-psl-error':
          isOnPublicSuffixList = false
          validatePslError = message.error
          ok.psl = false
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

  const originalSettingUpMessage = 'Setting up your place'
  let settingUpMessage = originalSettingUpMessage
  let settingUpMessageIntervalId
  $: if (creatingSite) {
    let dots = 0
    settingUpMessageIntervalId = setInterval(() => {
      dots++
      if (dots > 3) dots = 0
      settingUpMessage = originalSettingUpMessage + '<span style="color: inherit;">.<span>'.repeat(dots) + '<span style="color: white;">.</span>'.repeat(3-dots)
    }, 700)
  } else {
    settingUpMessage = originalSettingUpMessage + '...'
    clearInterval(settingUpMessageIntervalId)
  }

  function signOut () {
    window.location.reload()
  }
</script>

<main>

  <h1>{config.dns.domain} admin</h1>

  {#if !signedIn}
    <form on:submit|preventDefault>
      <label for='password'>Password:</label>
      <!--
        Since this is the only control on this page, the usability advantage
        outweighs the accessibility concern (which is valid on pages with more
        than one control).
      -->
      <!-- svelte-ignore a11y-autofocus -->
      <input id='password' type='password' bind:value={password} autofocus/>
      <button on:click={signIn}>Sign in</button>
    </form>

    {#if signingIn}
      <p style='color: blue;'>Signing in…</p>
    {/if}

    {#if errorMessage}
      <p style='color: red;'>❌️ {@html errorMessage}</p>
    {/if}
  {:else}
    <p class='signOut'><a href='/' on:click={signOut}>Sign out.</a></p>
    <TabbedInterface navStyle={true}>
      <TabList navStyle={true}>
        <Tab navStyle={true}>Setup</Tab>
        <Tab navStyle={true}>Places</Tab>
      </TabList>

      <TabPanel>
        <h2>Setup</h2>
        <p><strong><StatusMessage state={ok.all}>Your Small Web host {ok.all ? 'is fully configured and active' : 'needs configuration'}.</StatusMessage></strong></p>

        <TabbedInterface>
          <TabList>
            <Tab><StatusMessage state={ok.org}>Organisation</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.apps}>Apps</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.psl}>PSL</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.dns}>DNS</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.vps}>VPS</StatusMessage></Tab>
            <Tab><StatusMessage state={ok.payment}>Payment</StatusMessage></Tab>
          </TabList>

          <form on:submit|preventDefault>
            <TabPanel><Organisation {settings} /></TabPanel>
            <TabPanel><Apps {settings} /></TabPanel>
            <TabPanel><PSL {settings} {ok} {validatePslError} {PAYMENT_PROVIDERS} /></TabPanel>
            <TabPanel><DNS {settings} {ok} {validateDnsError} {validateDns} bind:dnsDomainInput={dnsDomainInput} bind:dnsAccountIdInput={dnsAccountIdInput} bind:dnsAccessTokenInput={dnsAccessTokenInput} /></TabPanel>

            <!-- VPS Settings -->
            <TabPanel>
              <h3 id='vps'>VPS Host Settings</h3>

              <h4>Hetzner</h4>

              <section class='instructions'>
                <h5>Instructions</h5>
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
                        Any Linux with systemd should work but you might have to adjust the Cloud Init scripts for your apps.
                    </p>
                  </AccordionItem>
                </Accordion>
              {/if}
            </TabPanel>


            <!-- Payment settings -->
            <TabPanel>
              <h3 id='payment'>Payment Settings</h3>

              <label for='paymentProvider'>Provider</label>
              <!-- svelte-ignore a11y-no-onchange -->
              <select
                class='openSelectBox'
                name='paymentProvider'
                id='paymentProvider'
                bind:value={settings.payment.provider}
                on:change={validatePayment}
                size={settings.payment.providers.length}
              >
                {#each settings.payment.providers as provider, index}
                  <option value={index}>{provider.name}</option>
                {/each}
              </select>

              {#if settings.payment.provider === 0}
                <!-- None: no payment provider. All server setups must be done via the admin. -->
                <section>
                  <h4>You’re all set!</h4>
                  <p>You do not need to set up a payment method to use Basil. When no payment method is set, all server deployments must be done here, from the administrator. You still need to set up the DNS and VPS settings. This is a good option if you just want to set up servers for yourself or for you and your family and friends, for example.</p>
                </section>
              {/if}

              {#if settings.payment.provider === 1}
                <!-- Tokens -->
                <section class='instructions'>
                  <h4>Instructions </h4>
                  <p><strong>Not implemented yet:</strong> Tokens are an alternative to using regular currency, credit/debit card transactions to provide access to servers. A munipicality, for example, might decide that it is a human right for every one of its citizens to have their own place on the Small Web. In this case, a munipicality might decide to issue tokens to every resident that they can use when setting up their place. The same municipality may also activate Stripe payments for those who want more than one site, etc.</p>
                </section>
              {/if}

              {#if settings.payment.provider === 2}
                <!-- Stripe. -->
                <section class='instructions'>
                  <h4>Instructions</h4>

                  <ol>
                    <li>Get a <a href='https://stripe.com'>Stripe</a> account.</li>
                    <li>Accept your <a href='https://stripe.com/dpa/legal'>Data Processing Addendum</a> (GDPR). Download and print a copy, sign it and keep it safe.</li>
                    <li>From your <a href='https://dashboard.stripe.com/dashboard'>Stripe dashboard</a>, get your <em>test API keys</em> and your live API keys and enter them below.</li>
                    <li>Set the price and currency to finish your Stripe configuration and create your monthly subscription. Please also read through the <a href='https://stripe.com/docs/currencies'>supported currencies</a> section of the Stripe documentation.</li>
                  </ol>

                  <p><em></em></p>
                </section>

                <h5>Subscription</h5>

                <p>Please note that you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web host is based in). These limitations are not bugs, they are features to encourage a Small Web. <a href='#payment-notes'>Learn more.</a></p>

                <label for='currency'>Currency</label>

                <select bind:value={stripeCurrency}>
                  {#each alphabeticallySortedCurrencyDetails as currency, index}
                    <option value={currency.code} selected={currency.code === 'eur'}>{currency.label}</option>
                  {/each}
                </select>

                {#if stripeCurrencyOnlyValidInUnitedArabEmirates}
                  <p><small><strong>* This currency is only supported if your organisation is set to United Arab Emirates in Stripe.</strong> For more information, please see the <a href='https://stripe.com/docs/currencies'>supported currencies</a> section of the Stripe documentation.</small></p>
                {/if}

                <label for='price'>Price/month</label>
                <input id='price' type='number' bind:value={stripePrice} step=1 min=1 on:input={validateStripePriceOnInput} on:change={validateStripePriceOnChange}/>

                <label for='mode'>Mode</label>
                <Switch id='mode' on:change={event => settings.payment.providers[2].mode = event.detail.checked ? 'live' : 'test'} checked={settings.payment.providers[2].mode === 'live'} width=75>
                  <span class='live' slot='checkedIcon'>Live</span>
                  <span class='test' slot='unCheckedIcon'>Test</span>
                </Switch>

                <TabbedInterface navStyle={true}>
                  <TabList navStyle={true}>
                    {#each settings.payment.providers[2].modeDetails as mode}
                      <Tab navStyle={true}>{mode.title}</Tab>
                    {/each}
                  </TabList>
                  {#each settings.payment.providers[2].modeDetails as mode}
                    <TabPanel>
                      <h4>{mode.title}</h4>
                      <p>The necesssary objects will be created for you automatically on Stripe once you add your Stripe keys.</p>

                      <ol class='serverCreationProgress'>
                        <li><StatusMessage state={ok.stripeProduct}>Product</StatusMessage></li>
                        <li><StatusMessage state={ok.stripePrice}>Price</StatusMessage></li>
                        <li><StatusMessage state={ok.stripeWebhook}>Webhook</StatusMessage></li>
                      </ol>
                      <label for={`${mode.id}PublishableKey`}>Publishable key</label>
                      <input id={`${mode.id}PublishableKey`} type='text' bind:value={mode.publishableKey} on:input={validatePayment(mode.id)}/>

                      <label class='block' for={`${mode.id}SecretKey`}>Secret Key</label>
                      <!-- TODO: Implement input event on SensitiveTextInput component. -->
                      <SensitiveTextInput name={`${mode.id}SecretKey`} bind:value={mode.secretKey} on:input={validatePayment(mode.id)}/>

                      {#if gotPrice[mode.id] && priceError[mode.id] !== null}
                        <p style='color: red;'>❌️ {priceError[mode.id]}</p>
                      {:else if gotPrice[mode.id]}
                        <p>✔️ Based on your Stripe {mode.id} mode product settings, your hosting price is set for <strong>{mode.currency}{mode.amount}/month.</p>
                      {:else}
                        <p>ℹ️ <em>Please enter your API key details to create your monthly subscription.</em></p>
                      {/if}

                      <section id='payment-notes'>
                        <h5>A note on commerical payment support.</h5>

                        <p>When taking commercial payments for your Small Web Host via Stripe, you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web host is based in). These limitations are not bugs, they are features to encourage a Small Web.</p>

                        <p>The idea is that no single Small Web host should scale beyond a certain point. Your Small Web host should be serving your community and you should let other Small Web hosts serve theirs. This is our <a href='https://small-web.org/about/#small-technology'>non-colonial approach</a> as per the <a href='https://small-web.org/about/#small-technology'>Small Technology Principles</a>.</p>

                        <p>Support for a commercial option is necessary for organisations that have to exist under capitalism. It doesn’t mean we have to play their shortsighted manipulative games or adopt their success criteria. The goal is for our organisations to provide a bridge to a post-capitalist future (e.g., on where cities can use tokens to provide their citizens with access to the commons from the commons).</p>

                        <p>You will not become rich by being a Small Web Host. If that’s your goal, please look elsewhere. However, you will hopefully be able to susbist under capitalism while helping bootstrap a kinder, fairer, and more caring world based on respect for human rights and democracy.</p>

                        <p><strong>If you are making money with your Small Web Host, please consider sharing a percentage of your earnings with <a href='https://small-tech.org/'>Small Technology Foundation</a> by <a href='https://small-tech.org/fund-us'>becoming a patron</a> so we can continue to develop the software you use to run yours.</strong></p>
                      </section>
                    </TabPanel>
                  {/each}
                </TabbedInterface>
              {/if}
            </TabPanel>
          </form>

        </TabbedInterface>
      </TabPanel>

      <TabPanel>
        <h2>Places</h2>
        <h3>Create a new Small Web place</h3>
        <p>You can create a new place without requiring payment details from here (e.g., for your own organisation, for friends, etc.)</p>

        <div id='createAppForm'>
          <label for='appToCreate'>App</label>
          <select
            id='appToCreate'
            bind:value={appToCreate}
            size={settings.apps.length}
            class='openSelectBox'
          >
            {#each settings.apps as app, index}
              <option value={index}>{app.name}</option>
            {/each}
          </select>

          <p class='label'>Passphrase</p>
          <p><strong>Store this passphrase is your password manager.</strong> You will need it to manage this domain.</p>
          <div class='passphrase'>{newPlacePassphrase}</div>

          <label class='checkbox-label'>
            <Checkbox bind:checked={passphraseSavedCheck}/> I have stored this passphrase in my password manager.
          </label>

          <label class='checkbox-label'>
            <Checkbox bind:checked={agreeToTerms}/> I agree to the terms of service.
          </label>


          <DomainChecker
            config={settings}
            buttonLabel='Create server'
            on:create={createServer}
          />
        </div>

        <h3>Hosted places</h3>
        <p>This is the list of Small Web places that are currently being hosted by you.</p>
        <p><strong>Nothing yet.</strong></p>
      </TabPanel>
    </TabbedInterface>
    {#if shouldShowSavedMessage}
      <div id='saved' transition:fade={{duration: 500}} tabindex='-1'>Auto-saved</div>
    {/if}
  {/if}

  <footer>
    <!--<p><strong>Like this? <a href='https://small-tech.org/fund-us'>Help fund the folks who make it.</a></strong></p>-->
    <p>This is a <a href='https://small-tech.org/research-and-development'>Small Web</a> Host run by <a href='{config.org.site}'>{config.org.name}.</a>
      {#if config.payment.provider !== PAYMENT_PROVIDERS.none}
        <br>
        <a href=''>Terms of Service</a>.
        <a href=''>Privacy Policy.</a>
      {/if}
    <a href='https://github.com/small-tech/basil'>View Source.</a></p>
  </footer>

</main>

<Modal show={showSiteCreationModal} title={settingUpMessage} hasCloseButton={siteCreationEnded} hasActionButton={siteCreationEnded} url={newSiteUrl}>

  <p class='modalIntroduction'>Setting up {settings ? settings.apps[appToCreate].name : ''} on <strong>{domainToCreate}.{settings ? settings.dns.domain : ''}</strong>.</p>

  <ol class='serverCreationProgress'>
    <li>
      <Checkbox checked={false} bind:checkedControlled={serverCreated} disabled={true}/>
      <span class:currentStep={serverCreationStep === 1}>Commission server</span>
    </li>
    <li>
      <Checkbox checked={false} bind:checkedControlled={domainNameRegistered} disabled={true}/>
      <span class:currentStep={serverCreationStep === 2}>Register domain name</span>
    </li>
    <li>
      <Checkbox checked={false} bind:checkedControlled={serverInitialised} disabled={true}/>
      <span class:currentStep={serverCreationStep === 3}>Initialise server</span>
      {#if serverCreationStep === 3}
        <progress value={$serverInitialisationProgress} />
      {/if}
    </li>
    <li>
      <Checkbox checked={false} bind:checkedControlled={appInstalled} disabled={true}/>
      <span class:currentStep={serverCreationStep === 4}>Install {settings ? settings.apps[appToCreate].name : ''}</span>
      {#if serverCreationStep === 4}
        <progress value={$appInstallProgress} />
      {/if}
    </li>
    <li>
      <Checkbox checked={false} bind:checkedControlled={appRunning} disabled={true}/>
      <span class:currentStep={serverCreationStep === 5}>Run {settings ? settings.apps[appToCreate].name : ''}</span>
      {#if serverCreationStep === 5}
        <progress value={$appRunProgress} />
      {/if}
    </li>
    <li>
      <Checkbox checked={false} bind:checkedControlled={securityCertificateReady} disabled={true}/>
      <span class:currentStep={serverCreationStep === 6}>Get security certificate</span>
      {#if serverCreationStep === 6}
        <progress value={$certificateProvisioningProgress} />
      {/if}
    </li>
    <li>
      <Checkbox checked={false} bind:checkedControlled={serverResponseReceived} disabled={true}/>
      <span class:currentStep={serverCreationStep === 7}>Wait for response from server</span>
      {#if serverCreationStep === 7}
        <Jumper />
      {/if}
    </li>
  </ol>

  {#if siteCreationSucceeded}
    <p class='appReady' in:scale={{duration: 600}}>🎉️ Your Small Web place is ready!</p>
  {/if}
</Modal>


<style>
  main {
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
    padding: 1em;
  }

  h1 {
    font-size: 4em;
    font-weight: 300;
    line-height: 1.5em;
    margin-bottom: 0.75em;
  }

  h2 {
    font-size: 3em;
    margin-top: 1em;
    margin-bottom: 0.5em;
  }

  h3 {
    font-size: 2em;
  }

  h4 {
    font-size: 1.5em;
    margin-top: 1.5em;
  }

  section > h4 {
    margin-top: 0.75em;
    margin-bottom: 0.75em;
  }

  h5 {
    font-size: 1.25em;
    margin-top: 1em;
    margin-bottom: 1em;
  }

  * :global(input, textarea, select) {
    display: block;
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  #password {
    display: inline-block;
  }

  label[for='password'] {
    display: block;
  }

  input[type='number'] {
    min-width: 4em;
    display: block !important;
  }

  * :global(textarea) {
    width: 100%;
    box-sizing: border-box;
    min-height: 200px;
  }

  * :global(textarea + small) {
    display: block;
    margin-top: -0.5em;
    font-style: italic;
  }

  label, .label {
    margin-bottom: 0.5em;
  }

  label[for=mode] {
    display: block;
    margin-bottom: 0;
  }

  footer {
    border-top: 1px solid black;
    margin-top: 3em;
  }

  footer > p {
    font-size: 1em;
  }

  :global(label[for=mode] + div) {
    margin-bottom: 1em;
  }

  /* Select the setup tabs */
  :global(ul:first-of-type) {
    margin-top: 3em;
    margin-bottom: 2em;
  }

  .checkbox-label {
    display: inline-block;
    margin: none;
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

  .appReady {
    text-align: center;
    font-size: 1.5em;
  }

  .modalIntroduction {
    font-size: 1.25em;
  }

  .signOut {
    text-align: right;
    font-size: 1.25em;
    margin-top: -1em;
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

  .passphrase {
    margin-bottom: 1.5em;
  }

  * :global(.openSelectBox) {
    scrollbar-width: none;
    overflow: hidden;
  }

  .serverCreationProgress {
    list-style-type: none;
    font-size: 1.5em;
  }

  progress {
    display: block;
    width: 70%;
    height: 5px;
    margin-top: -0.5em;
    margin-bottom: 0.3em;
    margin-left: 2.75em;
    background-color: #ccc;
    border: 0;
  }

  .currentStep {
    font-weight: bold;
  }

  #createAppForm {
    margin-bottom: 2em;
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

  #paymentProvider {
    min-width: 300px;
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
