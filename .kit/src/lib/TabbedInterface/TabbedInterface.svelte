<script>
  import { onMount, setContext } from 'svelte'
  import { writable } from 'svelte/store'

  // export let selectedIndex = 0

  const lastTabIndex = writable(-1)
  const lastTabPanelIndex = writable(-1)
  const activeTabIndex = writable(0 /* selectedIndex */)
  const focusedTabPanelIndex = writable(-1)

  setContext('lastTabIndex', lastTabIndex)
  setContext('lastTabPanelIndex', lastTabPanelIndex)
  setContext('activeTabIndex', activeTabIndex)
  setContext('focusedTabPanelIndex', focusedTabPanelIndex)

  // $: $activeTabIndex = selectedIndex

  onMount(() => {
  })

</script>

<div class='tabbed'>
  <slot></slot>
</div>

<style>
  :global(*) {
    color: inherit;
    margin: 0;
  }

  :global(*:focus) {
    outline: none;
    box-shadow: inset 0 0 0 4px lightBlue;
  }
</style>
