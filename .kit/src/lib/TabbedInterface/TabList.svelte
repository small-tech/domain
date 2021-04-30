<script>
  import { onMount } from 'svelte'

  let tabList
  let role = undefined

  onMount(() => {
    // We are setting the ARIA role dynamically, here, instead of
    // statically in the DOM as the component is progressively-enhanced.
    role = 'tablist'
  })
</script>

<ul {role} bind:this={tabList}>
  <slot></slot>
  <div id='force'></div>
</ul>

<style>
  /*
    Note: while these styles are included here, they are not scoped. As far as I can see,
    there isn’t a way to have scoped rules for selectors that do not match DOM elements at
    compile time (i.e., because they use dynamically-added ARIA roles like we do here).

    I’ve opened an issue on the Svelte repository to track this limitation:
    https://github.com/sveltejs/svelte/issues/6264
  */

  :global([role="tablist"]) {
    padding: 0;
  }

  :global([role="tablist"] li), :global([role="tablist"] a) {
    display: inline-block;
  }

  :global([role="tablist"] a) {
    text-decoration: none;
    padding: 0.5rem 1em;
  }

  @media (max-width: 550px) {
    :global([role="tablist"] li), :global([role="tablist"] a) {
      display: block;
      position: static;
    }

    :global([role="tablist"] a) {
      border: 2px solid #222 !important;
    }

    :global([role="tablist"] li + li a) {
      border-top: 0 !important;
    }
  }
</style>
