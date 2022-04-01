import { render } from "@testing-library/svelte";
import { expect } from "chai";

import Home from "./Home.svelte";

describe("<Home>", () => {
  it("renders learn svelte link", () => {
    const { getByText } = render(Home);
    const linkElement = getByText(/Панель администрирования/i);
    expect(document.body.contains(linkElement));
  });
});
