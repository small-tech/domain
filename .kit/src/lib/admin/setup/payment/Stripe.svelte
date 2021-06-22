<script>
  import Switch from 'svelte-switch'
  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import ServiceState from '../ServiceState.js'
  import StatusMessage from '../StatusMessage.svelte'

  import { PaymentProviders } from '$lib/Constants'

  import {
    alphabeticallySortedCurrencyDetails,
    additionalCurrenciesSupportedInUnitedArabEmirates
  } from '$lib/StripeCurrencies.js'

  export let settings
  export let socket
  export let state = new ServiceState()

  const ok = {
    test: {
      publishableKey: false,
      secretKey: false,
    },
    live: {
      publishableKey: false,
      secretKey: false
    }
  }

  let stripePrice = 10
  let previousStripePrice = stripePrice
  let formattedMinimumPrice
  let stripeCurrency
  let stripeCurrencyOnlyValidInUnitedArabEmirates = false
  let minimumStripePriceForCurrency = 1

  $: stripeCurrencyOnlyValidInUnitedArabEmirates = additionalCurrenciesSupportedInUnitedArabEmirates.includes(stripeCurrency)

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

  const MessageType = {
    settings: 'settings',
    paymentProviders: {
      stripe: {
        validateSecretKey: 'payment-providers.stripe.validate-secret-key'
      }
    }
  }

  const resultIs = type => `${type}.result`
  const errorIs = type => `${type}.error`

  async function validateSettings(modeId) {
    state.set(state.UNKNOWN)

    const modeDetails = settings.payment.providers[2].modeDetails[modeId]

    // Validate the publishable key (we can only validate this client-side
    // by creating a harmless dummy call and seeing if we get an error or not).

    const stripe = Stripe(modeDetails.publishableKey)
    const result = await stripe.createSource({
      type: 'ideal',
      amount: 1099,
      currency: 'eur',
      owner: {
        name: 'Jenny Rosen',
      },
      redirect: {
        return_url: 'https://shop.example.com/crtA6B28E1',
      },
    })

    if (result.error) {
      if (result.error.type === 'invalid_request_error' && result.error.message.beginsWith('Invalid API Key provided')) {
        state.set(state.NOT_OK, {error: {
          type: 'publishable-key-error',
          mode: modeId
        }})
        ok[modeId].publishableKey = false
        return
      }
    } else {
      ok[modeId].publishableKey = true
    }

    // Publishable key is OK for mode. Now let’s server-side verify the secret key.
    socket.send(JSON.stringify({
      type: 'payment-providers.stripe.validate-secret-key', // TODO: Implement server-side. LEFT OFF HERE.
      mode: modeId
    }))
  }

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)

    switch (message.type) {
      case MessageType.settings:
        validateSettings('test')
        validateSettings('live')
      break
    }
  })

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
</script>

<svelte:head>
  <!-- Include the stripe client-side library. -->
  <script src="https://js.stripe.com/v3/"></script>
</svelte:head>

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

<p>Please note that you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web Domain is based in). These limitations are not bugs, they are features to encourage a Small Web. <a href='#payment-notes'>Learn more.</a></p>

<label for='currency'>Currency</label>

<select id='currency' bind:value={stripeCurrency}>
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
<Switch id='mode' on:change={event => settings.payment.providers[2].mode = event.detail.checked ? 'live' : 'test'} checked={settings.payment.providers[2].mode === 'live'} handleDiameter='' width=75>

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
      <p>Your Stripe account will be automatically configured once you add your Stripe keys.</p>

      <!--
      <ol class='serverCreationProgress'>
        <li><StatusMessage>Product</StatusMessage></li>
        <li><StatusMessage>Price</StatusMessage></li>
        <li><StatusMessage>Webhook</StatusMessage></li>
      </ol>
      -->
      <label for={`${mode.id}PublishableKey`}>Publishable key</label>
      <input id={`${mode.id}PublishableKey`} type='text' bind:value={mode.publishableKey} on:input={validateSettings(mode.id)}/>

      <label class='block' for={`${mode.id}SecretKey`}>Secret Key</label>
      <!-- TODO: Implement input event on SensitiveTextInput component. -->
      <SensitiveTextInput name={`${mode.id}SecretKey`} bind:value={mode.secretKey} on:input={validateSettings(mode.id)}/>

      <section id='payment-notes'>
        <h5>A note on commerical payment support.</h5>

        <p>When taking commercial payments for your Small Web Domain via Stripe, you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web Domain is based in). These limitations are not bugs, they are features to encourage a Small Web.</p>

        <p>The idea is that no single Small Web Domain should scale beyond a certain point. Your Small Web Domain should be serving your community and you should let other Small Web Domains serve theirs. This is our <a href='https://small-web.org/about/#small-technology'>non-colonial approach</a> as per the <a href='https://small-web.org/about/#small-technology'>Small Technology Principles</a>.</p>

        <p>Support for a commercial option is necessary for organisations that have to exist under capitalism. It doesn’t mean we have to play their shortsighted manipulative games or adopt their success criteria. The goal is for our organisations to provide a bridge to a post-capitalist future (e.g., on where cities can use tokens to provide their citizens with access to the commons from the commons).</p>

        <p>You will not become rich by running a Small Web Domain. If that’s your goal, please look elsewhere. However, you will hopefully be able to susbist under capitalism while helping bootstrap a kinder, fairer, and more caring world based on respect for human rights and democracy.</p>

        <p><strong>If you are making money with your Small Web Domain, please consider sharing a percentage of your earnings with <a href='https://small-tech.org/'>Small Technology Foundation</a> by <a href='https://small-tech.org/fund-us'>becoming a patron</a> so we can continue to develop the software you use to run yours.</strong></p>
      </section>
    </TabPanel>
  {/each}
</TabbedInterface>

<style>
  #paymentProvider {
    min-width: 300px;
  }

  :global(label[for=mode] + div) {
    margin-bottom: 1em;
  }

  label[for=mode] {
    display: block;
    margin-bottom: 0;
  }

  .live, .test {
		color: white;
		display: inline-block;
		margin-top: 0.1em;
	}
  .test {
    margin-right: 0.75em;
  }

	.live {
		margin-left: 0.75em;
	}
</style>
