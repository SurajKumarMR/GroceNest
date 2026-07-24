import { isPasswordPwned } from '../../utils/pwned.utils';
import axios from 'axios';
import crypto from 'crypto';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Pwned Utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if password hash suffix is present in HIBP response', async () => {
    const password = 'password123';
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const suffix = hash.substring(5);

    mockedAxios.get.mockResolvedValueOnce({
      data: `${suffix}:150293\nOTHERHASH:12`,
    });

    const isPwned = await isPasswordPwned(password);
    expect(isPwned).toBe(true);
  });

  it('should return false if password hash suffix is NOT in HIBP response', async () => {
    const password = 'SuperSecretUniquePassword9981273!@#';

    mockedAxios.get.mockResolvedValueOnce({
      data: `SOMEOTHERSUFFIX:1\nANOTHERSUFFIX:4`,
    });

    const isPwned = await isPasswordPwned(password);
    expect(isPwned).toBe(false);
  });

  it('should return false gracefully if API request fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    const isPwned = await isPasswordPwned('anypassword');
    expect(isPwned).toBe(false);
  });
});
