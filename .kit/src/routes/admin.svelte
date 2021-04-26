<script>
  import { onMount } from 'svelte'

  let errorMessage = null
  let password = null
  let signingIn = false
  let signedIn = false
  let baseUrl

  $: if (signingIn) errorMessage = false

  onMount(() => {
    baseUrl = document.location.hostname
  })

  async function signIn () {
    signingIn = true
    let response
    try {
      response = await fetch(`https://${baseUrl}/admin/sign-in/${password}`)
    } catch (error) {
      errorMessage = `Network error: ${error}`
      signingIn = false
      return
    }
    if (response.status !== 200) {
      errorMessage = `Network error (${response.status})`
      signingIn = false
      return
    } else {
      try {
        signedIn = await response.json()
      } catch (erorr) {
        errorMesage = `Could not parse response (${error}).`
        signingIn = false
        return
      }
      if (!signedIn) {
        errorMessage = 'Password is incorrect.'
      }
    }
    signingIn = false
  }
</script>

<h1>Admin page</h1>

{#if !signedIn}
  <p>Please sign in to access this page.</p>
  <form on:submit|preventDefault>
    <label for='password'>Password:</label>
    <input name='password' type='password' bind:value={password}/>
    <button on:click={signIn}>Sign in</button>
  </form>

  {#if signingIn}
    <p style='color: blue;'>Signing in…</p>
  {/if}

  {#if errorMessage}
    <p style='color: red;'>❌️ {errorMessage}</p>
  {/if}
{:else}
  <p>Signed in.</p>
{/if}
