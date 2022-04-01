<script lang="ts">
  import Link from "../components/Link.svelte";
</script>

<div class="font-serif text-center">
  <header class="flex flex-col items-center justify-center h-screen text-3xl bg-gray-100">
    <img src="/logo.svg" class="h-64 m-4 pointer-events-none App-logo" alt="logo" />
    <div>
      <h1>Page 2</h1>
      <ul>
        <li class="text-base text-orange-500">
          <Link href="/page/1">Page 1</Link>
        </li>
        <li class="text-base text-orange-500">
          <Link href="/">Home</Link>
        </li>
      </ul>
    </div>
  </header>
</div>
