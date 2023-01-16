/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/no-explicit-any */
import isEqual from 'lodash.isequal';
import omit from 'lodash.omit';
import fetch, { Response } from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

beforeEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: 'POST' });
});

afterEach(async () => {
  await fetch(`${BASE_URL}/purge-test-database`, { method: 'POST' });
});

type LightningDevice = { [key: string]: string | string[] | number | object[] };

const createLightningDevices = async (): Promise<[LightningDevice[], Response]> => {
  const sourceItems = [];

  for (let index = 2; index > 0; index--) {
    sourceItems.push({
      name: `lightning-device-${index}`,
      brand: `FREON_${index}`,
      power: '24',
      lumens: '2700',
      lightTemperatureKelvin: 4000,
      resourceMs: 30_000,
      price: '600',
      currency: 'RUB',
      sellersWebsite: 'http://feron.ru',
      images: ['image_1', 'image_2', 'image_3'],
    });
  }

  const response = await fetch(`${BASE_URL}/create-lighting-devices`, {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(sourceItems),
  });

  return [sourceItems, response];
};

const compareSourceAndTargetItems = (sourceItems: LightningDevice[], targetItems: LightningDevice[]): boolean => {
  return sourceItems.some((sourceItem) => {
    return targetItems.some((targetItem) => {
      return Object.keys(sourceItem).every((sourceItemKey) => {
        return isEqual(sourceItem[sourceItemKey], targetItem[sourceItemKey]);
      });
    });
  });
};

const fetchCreateLightingGroups = async () => {
  const createLightingGroupsResponse = await fetch(`${BASE_URL}/create-lighting-groups`, {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocations: ['КУХНЯ', 'ГОСТИНАЯ', 'ИГРОВАЯ', 'ВАННАЯ'],
    }),
  });

  return createLightingGroupsResponse;
};

test('Create lightning devices', async () => {
  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);
});

test('Get lighting devices', async () => {
  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Read lighting devices
  const response = await fetch(`${BASE_URL}/get-lighting-devices`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
    },
  });

  expect(response.ok).toEqual(true);

  const readItems = await response.json();

  expect(compareSourceAndTargetItems(sourceItems, readItems)).toEqual(true);
});

test('Get lighting device', async () => {
  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems: LightningDevice[] = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Read lighting device
  const readItems: LightningDevice[] = await Promise.all(
    createdItems.map(async ({ id }) => {
      const response = await fetch(`${BASE_URL}/get-lighting-device?deviceId=${id}`, {
        method: 'GET',
        headers: {
          'Content-type': 'application/json',
        },
      });

      expect(response.ok).toEqual(true);

      return await response.json();
    }),
  );

  expect(compareSourceAndTargetItems(sourceItems, readItems)).toEqual(true);
});

test('Update product data lighting devices', async () => {
  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems: LightningDevice[] = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  const updatedSourceItems = createdItems.map((createdItem) => {
    return {
      id: createdItem.id,
      name: `${createdItem.name} UPDATED`,
      brand: `${createdItem.brand} UPDATED`,
      power: `${createdItem.power} UPDATED`,
      lumens: `${createdItem.lumens} UPDATED`,
      lightTemperatureKelvin: createdItem.lightTemperatureKelvin,
      resourceMs: createdItem.resourceMs,
      price: createdItem.price,
      currency: `${createdItem.currency} UPDATED`,
      sellersWebsite: `${createdItem.sellersWebsite} UPDATED`,
      images: createdItem.images,
    };
  });

  // ! Update lighting device product data
  const response = await fetch(`${BASE_URL}/update-product-data-lighting-devices`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(updatedSourceItems),
  });

  expect(response.ok).toEqual(true);

  const updatedItems = await response.json();

  expect(compareSourceAndTargetItems(updatedSourceItems, updatedItems)).toEqual(true);
});

test('Decommissioning lighting devices', async () => {
  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems: LightningDevice[] = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Decommissioning lighting devices
  const response = await fetch(`${BASE_URL}/decommissioning-lighting-devices`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ deviceIds: createdItems.map(({ id }) => id) }),
  });

  expect(response.ok).toEqual(true);

  const decommissionedItems = await response.json();

  const updatedSourceItems = sourceItems.map((sourceItem) => ({
    ...sourceItem,
    placeOfInstallation: 'NOT_INSTALLED',
    state: 'DECOMMISSIONED',
    history: [
      {
        placeOfInstallation: 'NOT_INSTALLED',
        turnedOnAt: null,
        turnedOffAt: null,
        workedMs: null,
      },
    ],
  }));

  expect(compareSourceAndTargetItems(updatedSourceItems, decommissionedItems)).toEqual(true);
});

test('Create lighting groups', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();
});

test('Get lighting groups', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Read lighting groups
  const getLightingGroupsResponse = await fetch(`${BASE_URL}/get-lighting-groups`, {
    method: 'GET',
    headers: {
      'Content-type': 'application/json',
    },
  });

  expect(getLightingGroupsResponse.ok).toEqual(true);

  const lightingGroups = await getLightingGroupsResponse.json();

  expect(lightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();
});

test('Get lighting group', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Read lighting group
  await Promise.all(
    createLightingGroups.map(async (createLightingGroup: any) => {
      const getLightingGroupResponse = await fetch(
        `${BASE_URL}/get-lighting-group?groupId=${createLightingGroup.location}`,
        {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        },
      );

      expect(getLightingGroupResponse.ok).toEqual(true);

      const lightingGroup = await getLightingGroupResponse.json();

      expect(compareSourceAndTargetItems(createLightingGroups, [lightingGroup])).toEqual(true);
    }),
  );
});

test('Add lighting devices in group', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Add lighting devices in lighting group
  const addLightingDevicesInGroupResponse = await fetch(`${BASE_URL}/add-lighting-devices-in-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocation: 'КУХНЯ',
      deviceIds: createdItems.map(({ id }: any) => id),
    }),
  });

  expect(addLightingDevicesInGroupResponse.ok).toEqual(true);

  const { lightingGroup, lightingDevices } = await addLightingDevicesInGroupResponse.json();

  expect(lightingGroup.location).toBe('КУХНЯ');
  expect(lightingGroup.state).toBe('OFF');
  expect(
    lightingGroup.devices.every((deviceId: string) => createdItems.some((device: any) => deviceId === device.id)),
  ).toBe(true);

  expect(lightingDevices.map((device: any) => omit(device, ['id', 'createdAt', 'updatedAt']))).toMatchSnapshot();
});

test('Remove lighting devices from group', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Add lighting devices in lighting group
  const addLightingDevicesInGroupResponse = await fetch(`${BASE_URL}/add-lighting-devices-in-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocation: 'КУХНЯ',
      deviceIds: createdItems.map(({ id }: any) => id),
    }),
  });

  expect(addLightingDevicesInGroupResponse.ok).toEqual(true);

  const { lightingGroup, lightingDevices } = await addLightingDevicesInGroupResponse.json();

  expect(lightingGroup.location).toBe('КУХНЯ');
  expect(lightingGroup.state).toBe('OFF');
  expect(
    lightingGroup.devices.every((deviceId: string) => createdItems.some((device: any) => deviceId === device.id)),
  ).toBe(true);

  expect(lightingDevices.map((device: any) => omit(device, ['id', 'createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Remove lighting devices from lighting group
  const removeLightingDevicesInGroupResponse = await fetch(`${BASE_URL}/remove-lighting-devices-from-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocation: 'КУХНЯ',
      deviceIds: createdItems.map(({ id }: any) => id),
    }),
  });

  expect(removeLightingDevicesInGroupResponse.ok).toEqual(true);

  const { lightingGroup: removedLightingGroup, lightingDevices: removedLightingDevices } =
    await removeLightingDevicesInGroupResponse.json();

  expect(removedLightingGroup.location).toBe('КУХНЯ');
  expect(removedLightingGroup.state).toBe('OFF');
  expect(
    removedLightingGroup.devices.every((deviceId: string) =>
      createdItems.some((device: any) => deviceId === device.id),
    ),
  ).toBe(true);

  expect(removedLightingDevices.map((device: any) => omit(device, ['id', 'createdAt', 'updatedAt']))).toMatchSnapshot();
});

test('Move lighting devices to another group', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Add lighting devices in lighting group
  const addLightingDevicesInGroupResponse = await fetch(`${BASE_URL}/add-lighting-devices-in-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocation: 'КУХНЯ',
      deviceIds: createdItems.map(({ id }: any) => id),
    }),
  });

  expect(addLightingDevicesInGroupResponse.ok).toEqual(true);

  const { lightingGroup, lightingDevices } = await addLightingDevicesInGroupResponse.json();

  expect(lightingGroup.location).toBe('КУХНЯ');
  expect(lightingGroup.state).toBe('OFF');
  expect(
    lightingGroup.devices.every((deviceId: string) => createdItems.some((device: any) => deviceId === device.id)),
  ).toBe(true);

  expect(lightingDevices.map((device: any) => omit(device, ['id', 'createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Move lighting devices to another group
  const moveLightingDevicesInGroupResponse = await fetch(`${BASE_URL}/move-lighting-device-to-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocationFrom: 'КУХНЯ',
      lightingGroupLocationTo: 'ГОСТИНАЯ',
      deviceIds: createdItems.map(({ id }: any) => id),
    }),
  });

  console.log(moveLightingDevicesInGroupResponse.statusText);

  expect(moveLightingDevicesInGroupResponse.ok).toEqual(true);

  const { lightingGroup: movedLightingGroup, lightingDevices: movedLightingDevices } =
    await moveLightingDevicesInGroupResponse.json();

  expect(movedLightingGroup.location).toBe('ГОСТИНАЯ');
  expect(movedLightingGroup.state).toBe('OFF');
  expect(
    movedLightingGroup.devices.every((deviceId: string) => createdItems.some((device: any) => deviceId === device.id)),
  ).toBe(true);

  expect(movedLightingDevices.map((device: any) => omit(device, ['id', 'createdAt', 'updatedAt']))).toMatchSnapshot();
});

test('Turn on and turn off lighting group', async () => {
  // ! Create lighting groups
  const createLightingGroupsResponse = await fetchCreateLightingGroups();

  expect(createLightingGroupsResponse.ok).toEqual(true);

  const createLightingGroups = await createLightingGroupsResponse.json();

  expect(createLightingGroups.map((item: any) => omit(item, ['createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Create lighting devices
  const [sourceItems, createLightningDeviceResponse] = await createLightningDevices();

  expect(createLightningDeviceResponse.ok).toEqual(true);

  const createdItems = await createLightningDeviceResponse.json();

  expect(compareSourceAndTargetItems(sourceItems, createdItems)).toEqual(true);

  // ! Add lighting devices in lighting group
  const addLightingDevicesInGroupResponse = await fetch(`${BASE_URL}/add-lighting-devices-in-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocation: 'КУХНЯ',
      deviceIds: createdItems.map(({ id }: any) => id),
    }),
  });

  expect(addLightingDevicesInGroupResponse.ok).toEqual(true);

  const { lightingGroup, lightingDevices } = await addLightingDevicesInGroupResponse.json();

  expect(lightingGroup.location).toBe('КУХНЯ');
  expect(lightingGroup.state).toBe('OFF');
  expect(
    lightingGroup.devices.every((deviceId: string) => createdItems.some((device: any) => deviceId === device.id)),
  ).toBe(true);

  expect(lightingDevices.map((device: any) => omit(device, ['id', 'createdAt', 'updatedAt']))).toMatchSnapshot();

  // ! Turn on lighting group
  const turnOnLightingGroupResponse = await fetch(`${BASE_URL}/turn-on-group`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      lightingGroupLocation: 'КУХНЯ',
    }),
  });

  expect(turnOnLightingGroupResponse.ok).toEqual(true);
});
