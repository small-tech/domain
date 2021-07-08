<script>
  import { onMount } from 'svelte'

  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import StatusMessage from '$lib/admin/setup/StatusMessage.svelte'
  import ServiceState from '$lib/admin/setup/ServiceState.js'

  import Remote from '@small-tech/remote'

  import { loadStripe } from '@stripe/stripe-js'

  import { slide } from 'svelte/transition'

  export let model

  export let socket
  const remote = new Remote(socket)

  let state = new ServiceState()

  const keysState = new ServiceState()
  const publishableKeyState = new ServiceState()
  const secretKeyState = new ServiceState()

  const stripeObjectsState = new ServiceState()

  const priceState = new ServiceState()
  const productState = new ServiceState()
  const webhookState = new ServiceState()

  let stripe

  async function getStripeObjects() {
    console.log('~~~ getStripeObjects ~~~')

    if (stripeObjectsState.is(stripeObjectsState.OK)) {
      // TODO: Ensure this doesn’t result in stale data.
      console.log('============ Already have Stripe objects. Not requesting again. =============')
      return
    }

    stripeObjectsState.set(stripeObjectsState.PROCESSING)

    try {
      const objects = await remote.paymentProviders.stripe.objects.get.request.await({modeId: model.id})
      console.log('Got stripe objects', objects)
      stripeObjectsState.set(stripeObjectsState.OK, { objects })
    } catch (error) {
      stripeObjectsState.set(stripeObjectsState.NOT_OK, { error })
      console.log('Error getting Stripe objects', error)
    }
  }

  function validateKeys () {
    if (publishableKeyState.is(publishableKeyState.OK) && secretKeyState.is(secretKeyState.OK)) {
      keysState.set(keysState.OK)
      getStripeObjects()
    } else if (publishableKeyState.is(publishableKeyState.NOT_OK) || (secretKeyState.is(secretKeyState.NOT_OK))) {
      keysState.set(keysState.NOT_OK)
    } else {
      keysState.set(keysState.UNKNOWN)
    }
  }

  async function validatePublishableKey() {
    publishableKeyState.set(publishableKeyState.PROCESSING)

    console.log('Stripe Mode component: validate publishable key for mode:', model.id)

    // Validate the publishable key (we can only validate this client-side
    // by creating a harmless dummy call and seeing if we get an error or not).
    stripe = await loadStripe(model.publishableKey, {
      apiVersion: '2020-08-27'
    })

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
      if (result.error.type === 'invalid_request_error' && result.error.message.startsWith('Invalid API Key provided')) {
        console.log('publishable key NOT ok')
        publishableKeyState.set(publishableKeyState.NOT_OK)
        validateKeys()
        return
      }
    } else {
      console.log('publishable key ok')
      publishableKeyState.set(publishableKeyState.OK)
      validateKeys()
    }
  }

  function validateSecretKey() {
    console.log('Stripe Mode component: validate secret key for mode:', model.id)
    secretKeyState.set(secretKeyState.PROCESSING)
    remote.paymentProviders.stripe.secretKey.validate.request.send({ modeId: model.id })
  }

  async function validateSettings() {
    console.log('Stripe Mode component: validate settings for mode:', model.id)

    await validatePublishableKey()
    validateSecretKey()
  }

  // Event handlers.

  onMount(() => {
    console.log(`Stripe Mode component: settings loaded. Validating settings for mode ${model.id}`)
    validateSettings()
  })

  remote.paymentProviders.stripe.secretKey.validate.response.handler = function (message) {
    if (message.modeId === model.id) {
      console.log(`Stripe Mode component: received secret key validation response:`, message)
      secretKeyState.set(message.ok ? secretKeyState.OK : secretKeyState.NOT_OK)
      validateKeys()
    }
  }
</script>

<h4>{model.title}</h4>
<p>Your Stripe account will be automatically configured once you add your Stripe keys.</p>

<label for={`${model.id}PublishableKey`}><StatusMessage state={publishableKeyState}>Publishable key</StatusMessage></label>

<input id={`${model.id}PublishableKey`} type='text' bind:value={model.publishableKey} on:input={validatePublishableKey()}/>

<label for={`${model.id}SecretKey`}><StatusMessage state={secretKeyState}>Secret key</StatusMessage></label>
<SensitiveTextInput id={`${model.id}SecretKey`} bind:value={model.secretKey} on:input={validateSecretKey()}/>

{#if $keysState.is(keysState.OK)}
  <details open transition:slide>
    <summary><StatusMessage state={stripeObjectsState}>Stripe Objects</StatusMessage></summary>
      {#if $stripeObjectsState.is(stripeObjectsState.OK)}
        <p>These objects were automatically configured for you in your Stripe account.</p>

        <h3>Product</h3>

        {stripeObjectsState.OK.product}

        <h3>Price</h3>

        {stripeObjectsState.OK.price}

        <h3>Webhook</h3>

        {stripeObjectsState.OK.webhook}
      {/if}

      {#if $stripeObjectsState.is(stripeObjectsState.NOT_OK)}
        <p>There was an error while attempting to create your Stripe objects:</p>
        <p>{stripeObjectsState.NOT_OK.error}</p>
      {/if}

      {#if $stripeObjectsState.is(stripeObjectsState.PROCESSING)}
        <p>Your Stripe objects are being created…</p>

        <ul class='serverCreationProgress'>
          <li><StatusMessage state={productState}>Product</StatusMessage></li>
          <li><StatusMessage state={priceState}>Price</StatusMessage></li>
          <li><StatusMessage state={webhookState}>Webhook</StatusMessage></li>
        </ul>
      {/if}
  </details>
{/if}

<style>
  summary {
    font-size: 1.5em;
    border-bottom: 2px dashed grey;
    padding-bottom:0.5em;
  }

  details {
    padding-bottom: 0.75em;
  }

  details[open], details[open] summary {
    border-bottom: 2px solid grey;
  }

  ul {
    list-style-type: none;
    font-size: 1.5em;
    line-height: 1.5;
    margin: 0;
  }
</style>
