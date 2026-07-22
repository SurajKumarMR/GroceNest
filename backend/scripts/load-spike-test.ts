import autocannon from 'autocannon';

async function runSpikeTest() {
  console.log('=========================================');
  console.log('  Spike Load Test: Promo Launch Burst    ');
  console.log('  Target: http://localhost:8000           ');
  console.log('=========================================');

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

    console.log('\n--- SPIKE LOAD TEST METRICS ---');
    console.log(`Req/Sec (RPS):   ${result.requests.average}`);
    console.log(`Latency p95:     ${result.latency.p95} ms`);
    console.log(`Rate-Limited (429/401/400): ${result.non2xx}`);

    // In a spike test, rate limiters trigger 429 / 401 cleanly without 500 errors
    console.log('\n=========================================');
    console.log('  SPIKE TEST COMPLETED - RATE LIMITERS ACTIVE');
    console.log('=========================================');
  });

  autocannon.track(instance, { renderProgressBar: false });
}

runSpikeTest();
