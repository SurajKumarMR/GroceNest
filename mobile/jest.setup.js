
import 'react-native-gesture-handler/jestSetup';

jest.mock('@stripe/stripe-react-native', () => ({
    useStripe: () => ({
        confirmPayment: jest.fn(),
        createPaymentMethod: jest.fn(),
        handleNextAction: jest.fn(),
        confirmSetupIntent: jest.fn(),
        retrievePaymentIntent: jest.fn(),
    }),
    StripeProvider: ({ children }) => children,
    CardField: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    mergeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    multiMerge: jest.fn(() => Promise.resolve()),
}));
