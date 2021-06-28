<script>
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import StatusMessage from '$lib/admin/setup/StatusMessage.svelte'
  import ServiceState from '$lib/admin/setup/ServiceState.js'

  export let mode
  export let remote
  export let settings

  let state = new ServiceState()

  let publishableKeyState = new ServiceState()
  let secretKeyState = new ServiceState()

  $: if (publishableKeyState.is(publishableKeyState.UNKNOWN) && secretKeyState.is(secretKeyState.UNKNOWN)) {
    state.set(state.UNKNOWN)
  } else if (publishableKeyState.is(publishableKeyState.NOT_OK) || secretKeyState.is(secretKeyState.NOT_OK)) {
    state.set(state.NOT_OK)
  } else if (publishableKeyState.is(publishableKeyState.OK) && secretKeyState.is(secretKeyState.OK)) {
    state.set(state.OK)
  } else {
    console.log('Warning: unexpected state. publishableKeyState, secretKeyState:', publishableKeyState, secretKeyState)
  }

  async function validatePublishableKeyForMode(modeId) {
    publishableKeyState.set(publishableKeyState.UNKNOWN)

    console.log('Stripe Mode component: validate publishable key for mode:', modeId)

    const modeDetails = settings.payment.providers[2].modeDetails.find(modeDetails => modeDetails.id === modeId)

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
      if (result.error.type === 'invalid_request_error' && result.error.message.startsWith('Invalid API Key provided')) {
        state.set(state.NOT_OK, {error: {
          type: 'publishable-key-error',
          mode: modeId
        }})
        console.log('publishable key NOT ok')
        publishableKeyState.set(publishableKeyState.NOT_OK)
        return
      }
    } else {
      console.log('publishable key ok')
      publishableKeyState.set(publishableKeyState.OK)
    }
  }

  function validateSecretKeyForMode(modeId) {
    console.log('Stripe Mode component: validate secret key for mode:', modeId)
    secretKeyState.set(secretKeyState.UNKNOWN)
    remote.paymentProviders.stripe.validate.secretKey.request.send({ modeId })
  }

  async function validateSettingsForMode(modeId) {
    console.log('Stripe Mode component: validate settings for mode:', modeId)

    await validatePublishableKeyForMode(modeId)
    validateSecretKeyForMode(modeId)
  }

  remote.settings.handler = message => {
    console.log(`Stripe Mode component: settings loaded. Validating settings for mode ${mode.id}`)
    validateSettingsForMode(mode.id)
  }

  remote.paymentProviders.stripe.validate.secretKey.response.handler = message => {
    console.log(`Stripe Mode component: received secret key validation response: ${message}`)
    secretKeyState.set(message.ok ? secretKeyState.OK : secretKeyState.NOT_OK)
  }
</script>

<h4>{mode.title}</h4>
<p>Your Stripe account will be automatically configured once you add your Stripe keys.</p>

<!--
<ol class='serverCreationProgress'>
  <li><StatusMessage>Product</StatusMessage></li>
  <li><StatusMessage>Price</StatusMessage></li>
  <li><StatusMessage>Webhook</StatusMessage></li>
</ol>
-->
<label for={`${mode.id}PublishableKey`}><StatusMessage bind:state={publishableKeyState}>Publishable key</StatusMessage></label>

<input id={`${mode.id}PublishableKey`} type='text' bind:value={mode.publishableKey} on:input={validatePublishableKeyForMode(mode.id)}/>

<label class='block' for={`${mode.id}SecretKey`}>Secret Key</label>
<!-- TODO: Implement input event on SensitiveTextInput component. -->
<SensitiveTextInput id={`${mode.id}SecretKey`} bind:value={mode.secretKey} on:input={validateSecretKeyForMode(mode.id)}/>
