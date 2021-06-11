<script>
  export let settings
  export let ok

  $: ok = settings === undefined ? false : settings.org.name !== '' && settings.org.address !== '' && settings.org.site !== '' && settings.org.email !== ''
</script>

<h3 id='organisation'>Organisation settings</h3>
<p>These details are used to populate the legal matter in the privacy policy and terms and conditions, etc. See Site.</p>

<label for='orgName'>Name</label>
<input name='orgName' type='text' bind:value={settings.org.name}/>

<label for='orgName'>Official Address</label>
<input name='orgName' type='text' bind:value={settings.org.address}/>

<label for='orgSite'>Web site</label>
<input name='orgSite' type='text' bind:value={settings.org.site}/>

<label for='orgEmail'>Support email</label>
<input name='orgEmail' type='text' bind:value={settings.org.email}/>

