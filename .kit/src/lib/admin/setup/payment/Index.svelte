<script>
  import ServiceState from '../ServiceState.js'

  import PaymentProviderNone from './None.svelte'
  import PaymentProviderTokens from './Tokens.svelte'
  import PaymentProviderStripe from './Stripe.svelte'

  export let settings
  export let socket
  export let state = new ServiceState()
</script>

{#if settings}
  <h3 id='payment'>Payment Settings</h3>

  <label for='paymentProvider'>Provider</label>
  <!-- svelte-ignore a11y-no-onchange -->
  <select
    class='openSelectBox'
    name='paymentProvider'
    id='paymentProvider'
    bind:value={settings.payment.provider}
    size={settings.payment.providers.length}
  >
    {#each settings.payment.providers as provider, index}
      <option value={index}>{provider.name}</option>
    {/each}
  </select>

  {#if settings.payment.provider === 0}
    <PaymentProviderNone bind:state={state} />
  {/if}

  {#if settings.payment.provider === 1}
    <PaymentProviderTokens {settings} {socket} bind:state={state}/>
  {/if}

  {#if settings.payment.provider === 2}
    <PaymentProviderStripe {settings} {socket} bind:state={state} />
  {/if}
{/if}

<style>
  select {
    min-width: 300px;
  }
</style>
