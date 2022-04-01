<script lang="ts">
  import type { History } from "history";
  import { getContext } from "svelte";

  export let href: string;
  export let className: string = "";

  const browserHistory: History = getContext("browserHistory");
</script>

<a on:click|preventDefault={() => browserHistory.push(href)} {href} class={className}>
  <slot>Link name</slot>
</a>
