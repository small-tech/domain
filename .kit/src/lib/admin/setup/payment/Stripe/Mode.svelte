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

  let productLink
  let priceLink
  let webhookLink

  let stripe

  async function validateStripeObjects() {
    console.log('~~~ validateStripeObjects ~~~')

    // Don’t fire off another validation request if one is already active.
    if (stripeObjectsState.is(stripeObjectsState.PROCESSING)) {
      console.log('============ stripe object validation request active, not firing new one =============')
      return
    }

    stripeObjectsState.set(stripeObjectsState.UNKNOWN)
    if (model.productId === '' || model.priceId === '' || model.webhookId === '') {
      stripeObjectsState.set(stripeObjectsState.PROCESSING)

      console.log('MODE ID', model.id)

      let product
      productState.set(productState.PROCESSING)
      try {
        price = await remote.paymentProviders.stripe.products.create.request.await({modeId: model.id})
      } catch (error) {
        productState.set(productState.NOT_OK)
        console.log('Product error', error)
        return
      }
      productState.set(productState.OK)
      console.log('product', product)

      // let price
      // priceState.set(priceState.PROCESSING)
      // try {
      //   price = await remote.paymentProviders.stripe.prices.create.request.await({modeId: model.id})
      // } catch (error) {
      //   priceState.set(priceState.NOT_OK)
      //   console.log('Price error', error)
      //   return
      // }
      // priceState.set(priceState.OK)
      // console.log('price', price)

      // const product = await remote.paymentProviders.stripe.products.create({modeId: model.id})

      // const webhook = await remote.paymentProviders.stripe.webhooks.create({modeId: model.id})

    }
  }

  function validateKeys () {
    if (publishableKeyState.is(publishableKeyState.OK) && secretKeyState.is(secretKeyState.OK)) {
      keysState.set(keysState.OK)
      validateStripeObjects()
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

    stripe = await loadStripe(model.publishableKey)

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
      <p>These objects are automatically configured in Stripe for you.</p>

      <ul class='serverCreationProgress'>
        <li>
          <StatusMessage state={productState}>Product</StatusMessage>
        </li>
        <li>
          <StatusMessage state={priceState}>Price</StatusMessage>
        </li>
        <li>
          <StatusMessage state={webhookState}>Webhook</StatusMessage>
        </li>
      </ul>
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
