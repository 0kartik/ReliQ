# ReliableQueue Load Test Report

**Date:** 2026-07-21T06:16:10.201Z
**Test:** 500 jobs, 2 workers, 1 simulated worker crash mid-run

## Results

| Metric | Value |
|---|---|
| Jobs submitted | 500 |
| Jobs accepted by gateway | 500 |
| Jobs rejected (validation/dup) | 0 |
| Jobs completed exactly once | 500 |
| Jobs in DLQ | 0 |
| Duplicate completions detected | 0 |
| Queues fully drained | Yes |
| Total wall-clock duration | 168.37s |

## Failure mode tested
A worker process was killed with SIGKILL 8000ms into the run, simulating an
unrecoverable crash mid-job-processing. The Reaper Service detected the resulting zombie
job(s) in the processing list after the configured timeout and recovered them to the main
queue, where the remaining/replacement worker picked them up and completed them normally.

## Conclusion
✅ Zero duplicate side-effects confirmed. Every accepted job reached exactly-once completion or was correctly quarantined in the DLQ, even with a simulated worker crash mid-run.
