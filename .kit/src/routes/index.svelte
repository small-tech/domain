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
          config: {site: {}, dns: {}, payment: {}}
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
  export let config
  export let serverError

  import DomainChecker from '$lib/DomainChecker.svelte'
  import { SvelteToast, toast } from '@zerodevx/svelte-toast'
  import Modal from '$lib/Modal.svelte'

  // Doing this in two-steps to the SvelteKit static adapter
  // doesn’t choke on it.
  import showdown from 'showdown'
  const { Converter } = showdown
  const converter = new Converter()

  const PAYMENT_PROVIDERS = {
    none: 0,
    token: 1,
    stripe: 2
  }
</script>

<main class='site'>
  <!-- <h1>{config.site.name || 'Basil'}</h1> -->
  {#if !serverError}
    {@html converter.makeHtml(config.site.header) || '<p>Small Web hosting template.</p>'}

    {#if config.payment.provider === PAYMENT_PROVIDERS.none}
      <p><strong>This is a private instance.</strong></p>
      <p>Please use <a href='/admin'>the adminstration interface</a> to set up Small Web places on <strong>{config.dns.domain}</strong>.</p>
    {:else if config.payment.provider === PAYMENT_PROVIDERS.token}
      <p><strong>Token-based sign-ups not yet implemented.</strong></p>
      <DomainChecker {config} />
    {:else if config.payment.provider === PAYMENT_PROVIDERS.stripe}
      <DomainChecker {config} />
    {/if}

    {@html converter.makeHtml(config.site.footer) || '<p>Site footer goes here.</p>'}
  {:else}
    <section id=server-error>
      <h2>Server error</h2>
      <pre>{serverError.details}</pre>
      {#if serverError.details.includes('ECONNREFUSED')}
        <p><strong>This is likely because Site.js is not running.</strong></p>
      {/if}
    </section>
  {/if}
</main>

<!-- <SvelteToast /> -->

<style>
  #server-error h2 {
    background: red;
    color: white;
    padding: 0.6em; /* optically adjusted as the error title always begin with an “s” */
  }

  #server-error pre {
    box-sizing: border-box;
    margin-top: -1.75em;
    padding: 1em;
    width: 100%;
    white-space: pre-wrap;
    border: 4px solid red;
  }
</style>
