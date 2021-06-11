<script>
  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import { Accordion, AccordionItem } from 'svelte-accessible-accordion'

  export let settings

  // TODO: refactor these
  export let ok
  export let validateVps
  export let validateVpsError
  export let vpsSshKey
  export let vpsSshKeyChange
  export let vpsDetails
  export let vpsServerType
  export let serverTypeChange
  export let vpsLocation
  export let vpsLocationChange
  export let vpsImage
  export let vpsImageChange
</script>

{#if settings}
  <h3 id='vps'>VPS Host Settings</h3>

  <h4>Hetzner</h4>

  <section class='instructions'>
    <h5>Instructions</h5>
    <ol>
      <li>Create a <a href='https://www.hetzner.com/cloud'>Hetzner Cloud</a> account.</li>
      <li><a href='https://accounts.hetzner.com/account/dpa'>Create a GDPR Data Protection Agreement</a>, accept it, download a copy, sign it, and keep it somewhere safe. (See <a href='https://docs.hetzner.com/general/general-terms-and-conditions/data-privacy-faq/'>Hetzner Data Privacy FAQ</a>)</li>
      <li><a href='https://console.hetzner.cloud/projects'>Create a new project</a> to hold the sites you will be hosting.</li>
      <li>Generate an API Token from <strong><em>your-project</em> → Security → API Tokens</strong> in your Hetzner dashboard and copy it below.</li>
    </ol>
  </section>

  {#if validateVpsError}
    <p style='color: red;'>❌️ {validateVpsError}</p>
  {:else if ok.vps}
    <p>✔️ Your VPS settings are correct.</p>
  {:else}
    <p>You’ll be informed once you have the correct details set.</p>
  {/if}

  <label id='vpsApiTokenLabel' for='vpsApiToken'>API Token (with read/write permissions)</label>
  <SensitiveTextInput
    name='vpsApiToken'
    bind:value={settings.vps.apiToken}
    on:input={validateVps}
  />

  {#if ok.vps}
    <!-- SSH keys -->
    <label for='vpsSshKey'>SSH Key Name</label>
    <!-- svelte-ignore a11y-no-onchange -->
    <select id='vpsSshKey' bind:value={vpsSshKey} on:change={vpsSshKeyChange}>
      {#each vpsDetails.sshKeys as sshKey}
        <option value={sshKey}>{sshKey.name}</option>
      {/each}
    </select>
    <ul class='vpsItemDetails'>
      <li>Created: {vpsSshKey.created}</li>
      <li>Fingerprint: {vpsSshKey.fingerprint}</li>
      <li>Public Key: <code>{vpsSshKey.public_key}</code></li>
    </ul>

    <Accordion>
      <AccordionItem title='Advanced'>
        <h3>Server details</h3>
        <p>These settings will be used when setting up servers.</p>

        <!-- VPS Server Types -->
        <label for='vpsServerType'>Server type</label>
        <!-- svelte-ignore a11y-no-onchange -->
        <select id='vpsServerType' bind:value={vpsServerType} on:change={serverTypeChange}>
          {#each vpsDetails.serverTypes as serverType}
            <option value={serverType}>{serverType.description}</option>
          {/each}
        </select>
        <p class='vpsItemDetails'>{vpsServerType.cores} cores, {vpsServerType.memory}GB memory, {vpsServerType.disk}GB disk. Cost: €{parseFloat(vpsServerType.prices[0].price_monthly.net).toFixed(2)}/month (exc. VAT).</p>

        <!-- VPS Locations -->
        <label for='vpsLocation'>Location</label>
        <!-- svelte-ignore a11y-no-onchange -->
        <select id='vpsLocation' bind:value={vpsLocation} on:change={vpsLocationChange}>
          {#each vpsDetails.locations as location}
            <option value={location}>{location.description.replace('DC', 'Data Centre')}</option>
          {/each}
        </select>
        <p class='vpsItemDetails'>{vpsLocation.city} ({vpsLocation.country}), {vpsLocation.network_zone.replace('eu-central', 'central EU')} network zone.</p>

        <!-- VPS Images -->
        <label for='vpsImage'>Image</label>
        <!-- svelte-ignore a11y-no-onchange -->
        <select id='vpsImage' bind:value={vpsImage} on:change={vpsImageChange}>
          {#each vpsDetails.images as image}
            <option value={image}>{image.description}</option>
          {/each}
        </select>
        <p class='vpsItemDetails'>
          {#if vpsImage.name === 'ubuntu-20.04'}
            <strong class='positive'>This is currently the only supported system for Small Web deployments.</strong>
          {:else}
            <strong class='warning'>This is an unsupported system for Small Web deployments.</strong>
          {/if}
            Any Linux with systemd should work but you might have to adjust the Cloud Init scripts for your apps.
        </p>
      </AccordionItem>
    </Accordion>
  {/if}
{/if}

<style>
  .vpsItemDetails {
    margin-top: -0.75em;
    font-size: smaller;
    font-style: italic;
  }

  :global([data-accordion]) {
    list-style: none;
    margin:0;
    padding: 0;
  }

  :global([data-accordion-item] button) {
    border: 0;
    background: none;
    font: inherit;
    font-size: 1.25em;
    font-weight: bold;
    line-height: inherit;
    color: inherit;
    cursor: pointer;
    width: 100%;
    text-align: left;
    margin: 0;
    padding: 0;
    padding-bottom: 0.75em;
    border-radius: 0;
    margin-top: 0.25em;
    border-bottom: 2px dashed grey;
  }

  :global([data-accordion-item] button[aria-expanded='false']::before) {
    content: ' ⯈ '
  }

  :global([data-accordion-item] button[aria-expanded='true']::before) {
    content: ' ⯆ '
  }
</style>