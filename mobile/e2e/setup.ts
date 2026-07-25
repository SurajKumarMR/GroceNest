import { device } from 'detox';

beforeAll(async () => {
  if (typeof device !== 'undefined' && device.launchApp) {
    await device.launchApp({ newInstance: true });
  }
});

beforeEach(async () => {
  if (typeof device !== 'undefined' && device.reloadReactNative) {
    await device.reloadReactNative();
  }
});

afterAll(async () => {
  if (typeof device !== 'undefined' && device.terminateApp) {
    await device.terminateApp();
  }
});
