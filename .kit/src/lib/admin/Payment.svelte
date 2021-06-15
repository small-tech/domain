<script>
  import Switch from 'svelte-switch'
  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  // import StatusMessage from '$lib/StatusMessage.svelte'

  import {
    alphabeticallySortedCurrencyDetails,
  } from '$lib/StripeCurrencies.js'

  export let settings

  // Refactor these during second pass of pull-out.
  export let ok
  export let validatePayment
  export let stripeCurrency
  export let stripePrice
  export let stripeCurrencyOnlyValidInUnitedArabEmirates
  export let validateStripePriceOnInput
  export let gotPrice
  export let priceError
  export let validateStripePriceOnChange
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
            <!-- <li><StatusMessage state={ok.stripeProduct}>Product</StatusMessage></li>
            <li><StatusMessage state={ok.stripePrice}>Price</StatusMessage></li>
            <li><StatusMessage state={ok.stripeWebhook}>Webhook</StatusMessage></li> -->
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

            <p>When taking commercial payments for your Small Web Domain via Stripe, you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web Domain is based in). These limitations are not bugs, they are features to encourage a Small Web.</p>

            <p>The idea is that no single Small Web Domain should scale beyond a certain point. Your Small Web Domain should be serving your community and you should let other Small Web Domains serve theirs. This is our <a href='https://small-web.org/about/#small-technology'>non-colonial approach</a> as per the <a href='https://small-web.org/about/#small-technology'>Small Technology Principles</a>.</p>

            <p>Support for a commercial option is necessary for organisations that have to exist under capitalism. It doesn’t mean we have to play their shortsighted manipulative games or adopt their success criteria. The goal is for our organisations to provide a bridge to a post-capitalist future (e.g., on where cities can use tokens to provide their citizens with access to the commons from the commons).</p>

            <p>You will not become rich by running a Small Web Domain. If that’s your goal, please look elsewhere. However, you will hopefully be able to susbist under capitalism while helping bootstrap a kinder, fairer, and more caring world based on respect for human rights and democracy.</p>

            <p><strong>If you are making money with your Small Web Domain, please consider sharing a percentage of your earnings with <a href='https://small-tech.org/'>Small Technology Foundation</a> by <a href='https://small-tech.org/fund-us'>becoming a patron</a> so we can continue to develop the software you use to run yours.</strong></p>
          </section>
        </TabPanel>
      {/each}
    </TabbedInterface>
  {/if}
{/if}

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

	.live {
		margin-left: 0.75em;
	}
</style>