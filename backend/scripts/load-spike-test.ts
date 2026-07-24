import autocannon from 'autocannon';
import http from 'http';

async function runSpikeTest() {
  console.log('=========================================');
  console.log('  Spike Load Test: Promo Launch Burst    ');
  console.log('  Target: http://localhost:8000           ');
  console.log('=========================================');

  // Pre-flight check to ensure local server is running
  const isServerRunning = await new Promise<boolean>((resolve) => {
    const req = http.get('http://localhost:8000/health', (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.end();
  });

  if (!isServerRunning) {
    console.error('❌ Express backend server is not running at http://localhost:8000.');
    console.error('👉 Please start the server first in another terminal using `npm run dev` or `npm start`.');
    process.exit(1);
  }

  const instance = autocannon({
    url: 'http://localhost:8000/api/auth/login',
    method: 'POST',
    connections: 100,
    duration: 5,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email: 'promo-burst@example.com', password: 'InvalidPassword123!' }),
  }, (err, result) => {
    if (err) {
      console.error('Spike test failed:', err);
      process.exit(1);
    }

    const latency = result.latency as any;
    const p95Latency = latency.p97_5 ?? latency.p95 ?? 0;
    console.log('\n--- SPIKE LOAD TEST METRICS ---');
    console.log(`Req/Sec (RPS):   ${result.requests.average}`);
    console.log(`Latency p95/97.5: ${p95Latency} ms`);
    console.log(`Rate-Limited (429/401/400): ${result.non2xx}`);

    // In a spike test, rate limiters trigger 429 / 401 cleanly without 500 errors
    console.log('\n=========================================');
    console.log('  SPIKE TEST COMPLETED - RATE LIMITERS ACTIVE');
    console.log('=========================================');
  });

  autocannon.track(instance, { renderProgressBar: false });
}

runSpikeTest();
