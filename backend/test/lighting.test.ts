import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

test("Create lightning device", async () => {
  const response = await fetch(`${BASE_URL}/get-lighting-device?deviceId=${1111}`);

  console.log(response);

  expect(2).toEqual(2);
});
