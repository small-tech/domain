<script>
  import { PAYMENT_PROVIDERS } from '$lib/Constants'

  export let settings
  export let socket

  const state = { UNKNOWN: {}, OK: {}, NOT_OK: {} }
  state.now = state.UNKNOWN

  const setState = (_state, _context) => {
    state[_state] = _context || {}
    state.now = state[_state]
    return state.now
  }

  const type = {
    SETTINGS: 'settings',
    VALIDATE_SETTINGS: 'validate-psl'
  }

  const success = (type) => type
  const error = (type) => `${type}-error`

  function validateSettings() {
    state.now = state.UNKNOWN

    // Domain does not need to be on the Public Suffix List for private instances.
    if (settings.payment.provider === PAYMENT_PROVIDERS.none) {
      return setState(state.OK, { isPrivateInstance: true })
    }

    // Otherwise, carry out validation.
    socket.send(JSON.stringify({
      type: type.VALIDATE_SETTINGS
    }))
  }

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)

    switch (message.type) {
      case success(type.SETTINGS):
        setTimeout(() => {
          state.NOT_OK = { error: 'Fake error.' }
          state.now = state.NOT_OK
        }, 4000)
        // validateSettings()
      break

      case success(type.VALIDATE_SETTINGS):
        state.OK = { isPrivateInstance: false }
        state.now = state.OK
      break

      case 'validate-psl-error':
        state.NOT_OK = { error: message.error }
        state.now = state.NOT_OK
      break
    }
  })

  function checkAgainNowButtonHandler() {
    validateSettings()
  }
</script>


<h3 id='psl'>Public Suffix List (PSL) Settings</h3>

{#if state.now === state.UNKNOWN}
  <p><strong>Checking if domain is on the Public Suffix List…</strong></p>
{/if}

{#if state.now === state.OK}
  {#if state.OK.privateInstance}
    <p><strong>✔️ Private instances do not have be registered on the <a href='https://publicsuffix.org'>Public Suffix List</a>.</strong></p>

    <p>A private instance is one where the payment provider is set to “none” and where domains can only be registered using this administration panel.</p>

    <p>The assumption with private instances is that all subdomains registered on the domain belong to the organisation running the Small Web Host. If this assumption is incorrect for your use case (and domains are owned by separate entities even though you register them manually from here), you should <a href='https://github.com/publicsuffix/list/wiki/Guidelines'>apply to have your domain added to the PSL.</a></p>

    <p>If you’re not on the PSL, realise that this will allow the domain to set privacy-violating “supercookies” that are valid for all subdomains.</p>

    <p><a href='https://publicsuffix.org/learn/'>Learn more.</a></p>
  {:else}
    <p><strong>✔️ Your domain is on the Public Suffix List.</strong></p>
  {/if}
{/if}

{#if state.now === state.NOT_OK}
  <p style='color: red;'><strong>❌️ {state.NOT_OK.error}</strong></p>
  <button on:click={checkAgainNowButtonHandler}>Check again now</button>
{/if}

{#if
  state.now === state.UNKNOWN
  || (state.now === state.OK && !state.OK.privateInstance)
  || state.now === state.NOT_OK
}
  <p>Public instances must be registered on the <a href='https://publicsuffix.org'>Public Suffix List</a> for privacy purposes.</p>

  <p>A public instance is one where the payment provider is set to anything but “none” where members of the public can register their own indepenedent Small Web places using tokens, money, etc.</p>

  <p>Without this requirement, the organisation running the Small Web Host could set a “supercookie” on the main domain and violate the privacy of the people who own and control the subdomains.</p>

  <p>Additionally, having the domain on the PSL enables browsers to highlight the most important part of a domain name when displaying it and accurately sort history entries by site.</p>

  <p><a href='https://publicsuffix.org/learn/'>Learn more.</a></p>
{/if}

{#if state.now === state.UNKNOWN || state.now === state.NOT_OK}
  <section class='instructions'>
    <h3>Instructions</h3>
    <ol>
      <li><a href='https://github.com/publicsuffix/list/wiki/Guidelines'>Read the guidelines</a> for submitting a domain to the <a href='https://publicsuffix.org'>Public Suffix List</a>.</li>
      <li>
        <p><a href='https://github.com/publicsuffix/list/pulls'>Submit your pull request</a> to amend the PSL.</p>
        <p>You can use <a href='https://small-web.org'>small-web.org’s pull request</a> as a template. You can also refer to that pull request in yours as an example of a precedent for acceptance of a Small Web Host onto the Public Suffix List.</p>
        <p>If you have any touble getting accepted, please contact <a href='https://small-tech.org'>Small Technology Foundation</a> at <a href='mailto:'>hello@small-tech.org</a> and we will help.</li>
    </ol>
    <p><strong>Once your domain is on the public suffix list, we will automatically detect the fact and enable your Small Web Host for public access.</strong></p>
  </section>
{/if}
