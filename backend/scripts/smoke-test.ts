
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

async function runSmokeTests() {
    console.log('🚀 Starting API Smoke Tests...');

    try {
        // 1. Health Check
        const health = await axios.get('http://localhost:8000/health').catch((err) => {
            console.error('❌ Express backend server is not running at http://localhost:8000.');
            console.error('👉 Please start the server first in another terminal using `npm run dev` or `npm start`.');
            process.exit(1);
        });
        console.log('✅ Health Check Passed:', health.data.status);

        // 2. Auth - Try to login with non-existent user
        try {
            await axios.post(`${BASE_URL}/auth/login`, {
                email: 'test@example.com',
                password: 'password123'
            });
        } catch (error: any) {
            if (error.response?.status === 401 || error.response?.status === 404) {
                console.log('✅ Auth Error Handling Passed (Expected 401/404)');
            } else {
                throw error;
            }
        }

        // 3. Stores - List Stores
        const stores = await axios.get(`${BASE_URL}/stores`);
        console.log('✅ List Stores Passed:', stores.data.length, 'stores found');

        // 4. Products - List Products (if possible)
        const products = await axios.get(`${BASE_URL}/products`);
        console.log('✅ List Products Passed:', products.data.length, 'products found');

        console.log('✨ All Smoke Tests Passed!');
    } catch (error: any) {
        console.error('❌ Smoke Test Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

runSmokeTests();
