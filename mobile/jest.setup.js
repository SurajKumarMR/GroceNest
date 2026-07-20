
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

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn(() => Promise.resolve(true)),
        signIn: jest.fn(() => Promise.resolve({
            data: {
                user: {
                    id: 'mock-id',
                    email: 'mock@example.com',
                    givenName: 'Mock',
                    familyName: 'User'
                }
            }
        })),
    },
    statusCodes: {
        SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
        IN_PROGRESS: 'IN_PROGRESS',
        PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    },
}));

jest.mock('react-native-maps', () => {
    const React = require('react');
    class MockMapView extends React.Component {
        render() {
            return React.createElement('MapView', this.props, this.props.children);
        }
    }
    class MockMarker extends React.Component {
        render() {
            return React.createElement('Marker', this.props, this.props.children);
        }
    }
    return {
        __esModule: true,
        default: MockMapView,
        Marker: MockMarker,
        PROVIDER_DEFAULT: 'default',
        PROVIDER_GOOGLE: 'google',
    };
});

jest.mock('react-native-svg', () => {
    return {
        __esModule: true,
        default: 'Svg',
        Svg: 'Svg',
        Path: 'Path',
        Circle: 'Circle',
        Rect: 'Rect',
        G: 'G',
    };
});
