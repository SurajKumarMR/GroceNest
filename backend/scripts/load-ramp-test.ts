import autocannon from 'autocannon';

async function runRampTest() {
  console.log('=========================================');
  console.log('  Ramp Load Test: 200 Concurrent Users   ');
  console.log('  Target: http://localhost:8000           ');
  console.log('=========================================');

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

    console.log('\n--- RAMP LOAD TEST METRICS ---');
    console.log(`Req/Sec (RPS):   ${result.requests.average}`);
    console.log(`Latency p50:     ${result.latency.p50} ms`);
    console.log(`Latency p95:     ${result.latency.p95} ms (SLA Threshold < 2000 ms)`);
    console.log(`Latency p99:     ${result.latency.p99} ms`);
    console.log(`2xx Responses:   ${result['2xx']}`);
    console.log(`Non-2xx Errors:  ${result.non2xx}`);

    if (result.latency.p95 <= 2000 && result.non2xx === 0) {
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
