import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

beforeEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

afterEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

test("Create lightning device", async () => {
  const createLightningDeviceResponse = await fetch(`${BASE_URL}/create-lighting-device`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(
      ["ON", "OFF", "IN_STOCK", "DECOMMISSIONED"].map((state, index) => ({
        name: `lightning-device-${index}`,
        brand: `FREON_${index}`,
        power: "24",
        lumens: "2700",
        lightTemperatureKelvin: 4000,
        resourceMs: 30_000,
        price: "600",
        currency: "RUB",
        sellersWebsite: "http://feron.ru",
        images: ["image_1", "image_2", "image_3"],
        placeOfInstallation: `Кухня_${index}`,
        state,
      })),
    ),
  });

  expect(createLightningDeviceResponse.ok).toEqual(true);
});
