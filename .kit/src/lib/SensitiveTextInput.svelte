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


<input name={name} type='password' bind:value={value} bind:this={input}/>
<button on:click={click} bind:this={button}>Show</button>

<style>
  input {
    display: inline;
  }

  button {
    min-width: 4.5em;
  }
</style>
