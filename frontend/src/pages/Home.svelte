<script lang="ts">
  import Link from "../components/Link.svelte";
  import { realtimeSyncLaunch } from "../realtime";

  const data = realtimeSyncLaunch("doc-id", {
    /* counter: 0 */
  });

  data.onInit((data) => console.log("onInit", { isEnabled: data.isEnable(), data }));
  data.onChange((change) => console.log("onChange", { change, data }));

  /*   const increment = () => data.counter++; */
  const setNewProp = () => {
    data.layer_0_number = 0;
    data.layer_0_string = "layer_0_string";
    data.layer_0_object = {
      layer_1_number: 100,
      layer_1_object: {
        layer_2_number: 200,
        layer_2_string: "layer_2_string",
        layer_2_object: {
          layer_3_number: 300,
          layer_3_string: "layer_3_string",
          layer_3_boolean: true,
          layer_3_null: null,
          layer_3_undefined: undefined,
        },
        layer_2_boolean: true,
        layer_2_null: null,
        layer_2_undefined: undefined,
      },
      layer_1_string: "layer_1_string",
      layer_1_boolean: true,
      layer_1_null: null,
      layer_1_undefined: undefined,
    };
    data.layer_0_boolean = true;
    data.layer_0_null = null;
    data.layer_0_undefined = undefined;

    console.log({ data });
  };
  const replaceProp = () => {
    data.layer_0_object = {
      layer_4_number: 900,
    };
  };

  /*   const defineProp = () =>
    Object.defineProperty(document, Math.random().toString(), {
      value: 5,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  const deleteProp = () => delete data.counter; */

  (window as any).data = data;
</script>

<div class="font-serif text-center">
  <header class="flex flex-col items-center justify-center h-screen text-3xl bg-gray-100">
    <img src="/logo.svg" class="h-64 m-4 pointer-events-none App-logo" alt="logo" />
    <div>
      <h1>Home</h1>
      <ul>
        <li class="text-base text-orange-500">
          <Link href="/page/1">Page 1</Link>
        </li>
        <li class="text-base text-orange-500">
          <Link href="/page/2">Page 2</Link>
        </li>
      </ul>
      <!-- <button on:click={increment}>Increment</button> -->
      <button on:click={setNewProp}>Set new prop</button>
      <button on:click={replaceProp}>Replace prop</button>
      <!-- <button on:click={defineProp}>DefineProp</button> -->
      <!-- <button on:click={deleteProp}>Delete</button> -->
    </div>
  </header>
</div>
