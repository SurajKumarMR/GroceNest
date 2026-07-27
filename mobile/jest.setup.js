global.IS_REACT_ACT_ENVIRONMENT = true;

require('react-native-gesture-handler/jestSetup');

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

jest.mock('@react-native-async-storage/async-storage', () => {
    let store = {};
    return {
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
            return Promise.resolve();
        }),
        getItem: jest.fn((key) => {
            return Promise.resolve(store[key] !== undefined ? store[key] : null);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
            return Promise.resolve();
        }),
        clear: jest.fn(() => {
            store = {};
            return Promise.resolve();
        }),
        getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
        multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, store[k] || null]))),
        multiSet: jest.fn((pairs) => {
            pairs.forEach(([k, v]) => { store[k] = String(v); });
            return Promise.resolve();
        }),
        multiRemove: jest.fn((keys) => {
            keys.forEach((k) => delete store[k]);
            return Promise.resolve();
        }),
        __resetStore: () => { store = {}; }
    };
});

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

jest.mock('@env', () => ({
    SOCKET_URL: 'http://localhost:8000',
}), { virtual: true });

jest.mock('socket.io-client', () => {
    const mSocket = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        id: 'mock-socket-id',
        connected: false,
    };
    return {
        io: jest.fn(() => mSocket),
        Socket: jest.fn(),
    };
});

jest.mock('lucide-react-native', () => {
    const React = require('react');
    const { View } = require('react-native');
    return new Proxy(
        {},
        {
            get: (target, prop) => {
                if (prop === '__esModule') return true;
                const IconMock = (props) => React.createElement(View, { testID: `icon-${String(prop)}`, ...props });
                IconMock.displayName = String(prop);
                return IconMock;
            },
        }
    );
});
