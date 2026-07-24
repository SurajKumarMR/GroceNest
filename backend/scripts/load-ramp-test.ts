import autocannon from 'autocannon';
import http from 'http';

async function runRampTest() {
  console.log('=========================================');
  console.log('  Ramp Load Test: 200 Concurrent Users   ');
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
    url: 'http://localhost:8000/api/products',
    connections: 200, // 200 concurrent virtual users
    duration: 10,     // 10 seconds ramp load
    pipelining: 1,
    headers: {
      'content-type': 'application/json',
    },
  }, (err, result) => {
    if (err) {
      console.error('Ramp load test encountered an error:', err);
      process.exit(1);
    }

    const latency = result.latency as any;
    const p95Latency = latency.p97_5 ?? latency.p95 ?? 0;
    console.log('\n--- RAMP LOAD TEST METRICS ---');
    console.log(`Req/Sec (RPS):   ${result.requests.average}`);
    console.log(`Latency p50:     ${latency.p50} ms`);
    console.log(`Latency p95/97.5: ${p95Latency} ms (SLA Threshold < 2000 ms)`);
    console.log(`Latency p99:     ${latency.p99} ms`);
    console.log(`2xx Responses:   ${result['2xx']}`);
    console.log(`Non-2xx Errors:  ${result.non2xx}`);

    if (p95Latency <= 2000 && result.non2xx === 0) {
      console.log('\n=========================================');
      console.log('  RAMP LOAD TEST PASSED PRE-DEFINED SLA! ');
      console.log('=========================================');
    } else {
      console.warn('\n⚠ Ramp test metrics exceeded SLA bounds');
    }
  });

  autocannon.track(instance, { renderProgressBar: false });
}

runRampTest();
