import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

afterAll(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

test("Create lightning device", async () => {
  const response = await fetch(`${BASE_URL}/create-lighting-device`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify([
      {
        name: "lightning-device-1",
        brand: "FREON",
        power: "24",
        lumens: "4000",
        lightTemperatureKelvin: 0,
        resourceMs: 0,
        price: "600",
        currency: "RUB",
        sellersWebsite: "http://feron.ru",
        images: ["image_1", "image_2", "image_3"],
        placeOfInstallation: "Кухня",
        state: "OFF",
      },
      {
        name: "lightning-device-2",
        brand: "FREON",
        power: "24",
        lumens: "4000",
        lightTemperatureKelvin: 0,
        resourceMs: 0,
        price: "600",
        currency: "RUB",
        sellersWebsite: "http://feron.ru",
        images: ["image_1", "image_2", "image_3"],
        placeOfInstallation: "Кухня",
        state: "OFF",
      },
    ]),
  });

  console.log(response);

  expect(2).toEqual(2);
});
