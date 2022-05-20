import isEqual from "lodash.isequal";
import omit from "lodash.omit";
import fetch, { Response } from "node-fetch";

const BASE_URL = "http://localhost:5000";

beforeEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

afterEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: "POST" });
});

type LightningDevice = { [key: string]: string | string[] | number | object[] };

const createLightningDevices = async (): Promise<[LightningDevice[], Response]> => {
  const sourceItems = [];

  for (let i = 6; i > 0; i--) {
    sourceItems.push({
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

  const response = await fetch(`${BASE_URL}/create-lighting-devices`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(sourceItems),
  });

  return [sourceItems, response];
};

const compareSourceAndTargetItems = (
  sourceItems: LightningDevice[],
  targetItems: LightningDevice[],
): boolean => {
  return !!sourceItems.find((sourceItem) => {
    return !!targetItems.find((targetItem) => {
      return Object.keys(sourceItem).every((sourceItemKey) => {
        return isEqual(sourceItem[sourceItemKey], targetItem[sourceItemKey]);
      });
    });
  });
};

test("Create lightning devices", async () => {
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);
});

test("Get lighting devices", async () => {
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  const response = await fetch(`${BASE_URL}/get-lighting-devices`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
    },
  });

  expect(response.ok).toEqual(true);

  const readItems = await response.json();

  expect(compareSourceAndTargetItems(sourceItems, readItems)).toEqual(true);
});

test("Get lighting device", async () => {
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems: LightningDevice[] = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  const readItems: LightningDevice[] = await Promise.all(
    createdItems.map(async ({ id }) => {
      const response = await fetch(`${BASE_URL}/get-lighting-device?deviceId=${id}`, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
        },
      });

      expect(response.ok).toEqual(true);

      return await response.json();
    }),
  );

  expect(compareSourceAndTargetItems(sourceItems, readItems)).toEqual(true);
});

test("Update product data lighting devices", async () => {
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems: LightningDevice[] = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  const updatedSourceItems = createdItems.map((createdItem) => {
    return {
      id: createdItem.id,
      name: createdItem.name + " UPDATED",
      brand: createdItem.brand + " UPDATED",
      power: createdItem.power + " UPDATED",
      lumens: createdItem.lumens + " UPDATED",
      lightTemperatureKelvin: createdItem.lightTemperatureKelvin,
      resourceMs: createdItem.resourceMs,
      price: createdItem.price,
      currency: createdItem.currency + " UPDATED",
      sellersWebsite: createdItem.sellersWebsite + " UPDATED",
      images: createdItem.images,
    };
  });

  const response = await fetch(`${BASE_URL}/update-product-data-lighting-devices`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(updatedSourceItems),
  });

  expect(response.ok).toEqual(true);

  const updatedItems = await response.json();

  expect(compareSourceAndTargetItems(updatedSourceItems, updatedItems)).toEqual(true);
});

test("Decommissioning lighting devices", async () => {
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems: LightningDevice[] = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  const response = await fetch(`${BASE_URL}/decommissioning-lighting-devices`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ deviceIds: createdItems.map(({ id }) => id) }),
  });

  expect(response.ok).toEqual(true);

  const decommissionedItems = await response.json();

  const updatedSourceItems = sourceItems.map((sourceItem) => ({
    ...sourceItem,
    placeOfInstallation: "NOT_INSTALLED",
    state: "DECOMMISSIONED",
    history: [
      {
        placeOfInstallation: "NOT_INSTALLED",
        turnedOnAt: null,
        turnedOffAt: null,
        workedMs: null,
      },
    ],
  }));

  expect(compareSourceAndTargetItems(updatedSourceItems, decommissionedItems)).toEqual(true);
});

test("Initialize lighting groups", async () => {
  const initializeLightingGroupsResponse = await fetch(`${BASE_URL}/initialize-lighting-groups`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      lightingGroupLocations: ["КУХНЯ", "ГОСТИНАЯ", "ИГРОВАЯ", "ВАННАЯ"],
    }),
  });

  expect(initializeLightingGroupsResponse.ok).toEqual(true);

  const initializeLightingGroups = await initializeLightingGroupsResponse.json();

  expect(
    initializeLightingGroups.map((item: any) => omit(item, ["createdAt", "updatedAt"])),
  ).toMatchSnapshot();
});

test("Get lighting groups", async () => {
  const initializeLightingGroupsResponse = await fetch(`${BASE_URL}/initialize-lighting-groups`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      lightingGroupLocations: ["КУХНЯ", "ГОСТИНАЯ", "ИГРОВАЯ", "ВАННАЯ"],
    }),
  });

  expect(initializeLightingGroupsResponse.ok).toEqual(true);

  const initializeLightingGroups = await initializeLightingGroupsResponse.json();

  expect(
    initializeLightingGroups.map((item: any) => omit(item, ["createdAt", "updatedAt"])),
  ).toMatchSnapshot();

  const getLightingGroupsResponse = await fetch(`${BASE_URL}/get-lighting-groups`, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
    },
  });

  expect(getLightingGroupsResponse.ok).toEqual(true);

  const lightingGroups = await getLightingGroupsResponse.json();

  expect(
    lightingGroups.map((item: any) => omit(item, ["createdAt", "updatedAt"])),
  ).toMatchSnapshot();
});

test("Get lighting group", async () => {
  const initializeLightingGroupsResponse = await fetch(`${BASE_URL}/initialize-lighting-groups`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      lightingGroupLocations: ["КУХНЯ", "ГОСТИНАЯ", "ИГРОВАЯ", "ВАННАЯ"],
    }),
  });

  expect(initializeLightingGroupsResponse.ok).toEqual(true);

  const initializeLightingGroups = await initializeLightingGroupsResponse.json();

  expect(
    initializeLightingGroups.map((item: any) => omit(item, ["createdAt", "updatedAt"])),
  ).toMatchSnapshot();

  await Promise.all(
    initializeLightingGroups.map(async (initializeLightingGroup: any) => {
      const getLightingGroupResponse = await fetch(
        `${BASE_URL}/get-lighting-group?groupId=${initializeLightingGroup.location}`,
        {
          method: "GET",
          headers: {
            "Content-type": "application/json",
          },
        },
      );

      expect(getLightingGroupResponse.ok).toEqual(true);

      const lightingGroup = await getLightingGroupResponse.json();

      expect(compareSourceAndTargetItems(initializeLightingGroups, [lightingGroup])).toEqual(true);
    }),
  );
});

test("Add lighting devices in group", async () => {
  const initializeLightingGroupsResponse = await fetch(`${BASE_URL}/initialize-lighting-groups`, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      lightingGroupLocations: ["КУХНЯ", "ГОСТИНАЯ", "ИГРОВАЯ", "ВАННАЯ"],
    }),
  });

  expect(initializeLightingGroupsResponse.ok).toEqual(true);

  const initializeLightingGroups = await initializeLightingGroupsResponse.json();

  expect(
    initializeLightingGroups.map((item: any) => omit(item, ["createdAt", "updatedAt"])),
  ).toMatchSnapshot();

  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  const addLightingDevicesInGroupResponse = await fetch(
    `${BASE_URL}/add-lighting-devices-in-group`,
    {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        lightingGroupLocation: "КУХНЯ",
        deviceIds: createdItems.map(({ id }: any) => id),
      }),
    },
  );

  expect(addLightingDevicesInGroupResponse.ok).toEqual(true);

  const lightingDevicesInGroup = await addLightingDevicesInGroupResponse.json();
});
