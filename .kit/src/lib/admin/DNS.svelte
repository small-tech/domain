<script>
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'

  export let settings

  // TODO: Refactor these once all sections have been pulled out.
  export let validateDnsError
  export let validateDns
  export let ok
  export let dnsDomainInput
  export let dnsAccountIdInput
  export let dnsAccessTokenInput
</script>

{#if settings}
  <h3 id='dns'>DNS Settings</h3>

  <h4>DNSimple</h4>

  <section class='instructions'>
    <h5>Instructions</h5>
    <ol>
      <li>Get a <a href='https://dnsimple.com'>DNSimple</a> account (a personal account should suffice as you only need to add subdomains to one domain).</li>
      <li><strong>DNSimple does not provide GDPR Data Protection Agreements for anything less than their $300/mo business accounts.</strong> They say one is not necessary for hosting subdomains. (see <a href='https://blog.dnsimple.com/2018/05/gdpr/'>GDPR at DNSimple</a>, <a href='https://dnsimple.com/privacy'>DNSimple Privacy Policy</a>).</li>
      <li>Add your domain to your DNSimple dashboard and find the details required on it under <strong>Account → Automation</strong>.</li>
    </ol>
  </section>

  {#if validateDnsError}
    <p style='color: red;'>❌️ {validateDnsError}</p>
  {:else if ok.dns}
    <p>✔️ Your DNS settings are correct.</p>
  {:else}
    <p>You’ll be informed once you have the correct details set.</p>
  {/if}

  <label for='domain'>Domain</label>
  <input
    id='domain'
    name='domain'
    type='text'
    bind:value={settings.dns.domain}
    bind:this={dnsDomainInput}
    on:input={validateDns}
  />

  <label id='accountIdLabel' for='dnsAccountId'>Account ID</label>
  <SensitiveTextInput
    name='dnsAccountId'
    bind:value={settings.dns.accountId}
    bind:this={dnsAccountIdInput}
    on:input={validateDns}
  />

  <label for='dnsAccessToken' class='block'>Access Token</label>
  <SensitiveTextInput
    name='dnsAccessToken'
    bind:value={settings.dns.accessToken}
    bind:this={dnsAccessTokenInput}
    on:input={validateDns}
  />
{/if}
