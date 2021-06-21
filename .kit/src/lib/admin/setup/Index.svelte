<script>
  import { fade } from 'svelte/transition'

  import StatusMessage from './StatusMessage.svelte'
  import ServiceState from './ServiceState.js'

  import DataProxy from '$lib/JSDB/DataProxy'
  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'

  // Setup panels.
  import Organisation from '$lib/admin/setup/Organisation.svelte'
  import Apps from '$lib/admin/setup/Apps.svelte'
  import PSL from '$lib/admin/setup/PSL.svelte'
  import DNS from '$lib/admin/setup/DNS.svelte'
  import VPS from '$lib/admin/setup/VPS.svelte'
  import Payment from '$lib/admin/setup/payment/Index.svelte'

  export let socket

  let settings

  let organisationState
  let appsState
  let pslState
  let dnsState
  let vpsState
  let paymentState

  let shouldShowSavedMessage = false

  const state = new ServiceState()

  $: if (
    $organisationState === undefined
    || $appsState === undefined
    || $pslState === undefined
    || $dnsState === undefined
    || $vpsState === undefined
    || $paymentState === undefined
  ) {
    state.set(state.UNKNOWN)
  } else if (
    organisationState.is(organisationState.OK)
    && appsState.is(appsState.OK)
    && pslState.is(pslState.OK)
    && dnsState.is(dnsState.OK)
    && vpsState.is(vpsState.OK)
    && paymentState.is(paymentState.OK)
  ) {
    // All services are OK.
    state.set(state.OK)
  } else if (
    organisationState.is(organisationState.NOT_OK)
    || appsState.is(appsState.NOT_OK)
    || pslState.is(pslState.NOT_OK)
    || dnsState.is(dnsState.NOT_OK)
    || vpsState.is(vpsState.NOT_OK)
    || paymentState.is(paymentState.NOT_OK)
  ) {
    // At least one service needs configuration.
    state.set(state.NOT_OK)
  } else {
    // None of the service states is known.
    state.set(state.UNKNOWN)
  }

  socket.addEventListener('message', event => {
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
      break
    }
  })

  function showSavedMessage() {
    if (shouldShowSavedMessage) return
    shouldShowSavedMessage = true
    setTimeout(() => shouldShowSavedMessage = false, 1500)
  }

</script>

<h2>Setup</h2>

<p><strong>
  <StatusMessage state={$state}>
    {#if $state.is(state.UNKNOWN)}
      Checking configuration state…
    {/if}
    {#if $state.is(state.OK)}
      Your Small Web Domain is configured and ready for use.
    {/if}
    {#if $state.is(state.NOT_OK)}
      Your Small Web Domain needs configuration.
    {/if}
  </StatusMessage>
</strong></p>

<TabbedInterface>
  <TabList>
    <Tab><StatusMessage bind:state={$organisationState}>Organisation</StatusMessage></Tab>
    <Tab><StatusMessage bind:state={$appsState}>Apps</StatusMessage></Tab>
    <Tab><StatusMessage bind:state={$pslState}>PSL</StatusMessage></Tab>
    <Tab><StatusMessage bind:state={$dnsState}>DNS</StatusMessage></Tab>
    <Tab><StatusMessage bind:state={$vpsState}>VPS</StatusMessage></Tab>
    <Tab><StatusMessage bind:state={$paymentState}>Payment</StatusMessage></Tab>
  </TabList>

  <form on:submit|preventDefault>
    <TabPanel><Organisation {settings} bind:state={organisationState} /></TabPanel>
    <TabPanel><Apps {settings} bind:state={appsState} /></TabPanel>
    <TabPanel><PSL {settings} {socket} bind:state={pslState} /></TabPanel>
    <TabPanel><DNS {settings} {socket} bind:state={dnsState} /></TabPanel>
    <TabPanel><VPS {settings} {socket} bind:state={vpsState} /></TabPanel>
    <TabPanel><Payment {settings} {socket} bind:state={paymentState} /></TabPanel>
  </form>
</TabbedInterface>

{#if shouldShowSavedMessage}
  <div id='saved' transition:fade={{duration: 500}} tabindex='-1'>Auto-saved</div>
{/if}

<style>
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
</style>
