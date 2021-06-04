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
  import {onMount} from 'svelte'
  import stretchy from '$lib/stretchy.js'

  import {browser} from '$app/env'

  // Doing this in two-steps to the SvelteKit static adapter
  // doesn’t choke on it.
  import showdown from 'showdown'
  const { Converter } = showdown
  const converter = new Converter()

  if (browser) {
    stretchy()
  }

  let mounted = false
  onMount(() => {
    mounted = true
  })

  let domain = ''
</script>

<main class='site'>
  <form>
    <p>I want my own <select><option value='Place'>Place</option><option value='Site.js'>Site.js</option><option value='Owncast'>Owncast</option></select> at <span class='domain'><input type='text' placeholder='domain'>.{config.dns.domain}</span> for €10/month.</p>
    <button>Get started!</button>
  </form>

  <p class='sign-in'>Already have a place? <a href='sign-in'>Sign in.</a></p>

  <p><strong>Need help?</strong> Email Laura and Aral at <a href='mailto:{config.org.email}'>{config.org.email}.</a></p>

  <footer>
    <!--<p><strong>Like this? <a href='https://small-tech.org/fund-us'>Help fund the folks who make it.</a></strong></p>-->
    <p>This is a <a href='https://small-tech.org/research-and-development'>Small Web</a> Host run by <a href='{config.org.site}'>{config.org.name}.</a><br><a href=''>Terms of Service</a>. <a href=''>Privacy Policy.</a> <a href='https://github.com/small-tech/basil'>View Source.</a></p>
  </footer>

  <!-- <h1>{config.site.name || 'Basil'}</h1> -->
  <!-- {#if !serverError}
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

    <hr>

    <h2>Already have a place? Sign in to manage it.</h2>

    {@html converter.makeHtml(config.site.footer) || '<p>Site footer goes here.</p>'}
  {:else}
    <section id=server-error>
      <h1>Server error</h1>
      <pre>{serverError.details}</pre>
      {#if serverError.details.includes('ECONNREFUSED')}
        <p><strong>This is likely because Site.js is not running.</strong></p>
      {/if}
    </section>
  {/if} -->
</main>

<!-- <SvelteToast /> -->

<style>

  .keep-together {
    white-space: nowrap;
  }

  .sign-in {
    font-size: 1.5em;
  }

  button {
    font-size: 2em;
    border: 0px;
    background-color: #1CAC78;
    color: white;
    display: block;
    margin-bottom: 1.5em;
  }

  a {
    color: #1F75FE;
  }

  main {
    padding: 1em;
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }

  footer {
    border-top: 1px solid black;
    margin-top: 3em;
  }

  footer > p {
    font-size: 1em;
  }

  p {
    font-size: 1.25em;
  }

  form > p {
    font-size: 4em;
    font-weight: 300;
    line-height: 1.5em;
    margin-bottom: 0.75em;
  }

  select, input[type='text'] {
    border: 0;
    border-bottom: 3px solid black;
    border-radius: 0;
  }

  select {
    appearance: none;
    display: inline-block;
    font-size: 1em;
    text-align: center;
    font-weight: 600;
    padding: 0;
    text-align: center;
    color: #1CAC78;
  }

  input[type='text'] {
    display: inline-block;
    width: 5em;
    font-size: 1em;
    text-align: right;
    font-weight: 600;
    color: #1CAC78;
    height: 1.5em;
    padding: 0;
  }

  #server-error h1 {
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
