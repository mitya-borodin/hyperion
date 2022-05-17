import { number } from "fp-ts";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

beforeEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

afterEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

test("Create lightning device", async () => {
  const items = [];

  for (let i = 5; i > 0; i--) {
    items.push({
      name: `lightning-device-${i}`,
      brand: `FREON_${i}`,
      power: "24",
      lumens: "2700",
      lightTemperatureKelvin: 4000,
      resourceMs: 30_000,
      price: "600",
      currency: "RUB",
      sellersWebsite: "http://feron.ru",
      images: ["image_1", "image_2", "image_3"],
    });
  }

  const createLightningDeviceResponse = await fetch(`${BASE_URL}/create-lighting-devices`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(items),
  });

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createLightningDevices = await createLightningDeviceResponse.json();

  for (let i = 5; i > 0; i--) {
    const item: { [key: string]: string | string[] | number } = items[i - 1];
    const lightningDevice = createLightningDevices[i - 1];

    for (const key of Object.keys(item)) {
      expect(item[key]).toEqual(lightningDevice[key]);
    }
  }
});
