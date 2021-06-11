<svelte:options accessors={true}/>
<script>
  export let name
  export let value

  let input
  let button

  const click = () => {
    if (input.type === 'password') {
      input.type = 'text'
      button.innerText = 'Hide'
    } else {
      input.type = 'password'
      button.innerText = 'Show'
    }
  }
</script>


<div/>
<input name={name} type='password' bind:value={value} bind:this={input}/>
<button on:click={click} bind:this={button}>Show</button>
<div/>

<style>
  /* Why do we need !important here? One of the global-yet-scoped
     styles must be leaking through */
  input {
    display: inline-block !important;
  }

  button {
    min-width: 4.5em;
  }

  div {
    margin-top: 0 !important;
  }
</style>
