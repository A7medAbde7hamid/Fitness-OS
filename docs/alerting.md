# Alerting Thresholds

## Critical Alerts (Immediate Response)

| Metric | Threshold | Action |
|--------|-----------|--------|
| 5xx error rate | > 5% for 5 min | Investigate immediately |
| Health check failure | Any | Check all services |
| Database connection failure | Any | Check Supabase status |
| AI API key invalid | Any | Rotate key immediately |
| WhatsApp webhook failures | > 10% for 5 min | Check provider status |

## Warning Alerts (Investigate Within 1 Hour)

| Metric | Threshold | Action |
|--------|-----------|--------|
| 4xx error rate | > 20% for 15 min | Check for abuse or bugs |
| AI failure rate | > 10% for 15 min | Check Gemini API status |
| Sync failure rate | > 15% for 15 min | Check sync queue health |
| Request latency p95 | > 5s for 10 min | Performance investigation |
| Database latency p95 | > 2s for 10 min | Query optimization |

## Info Alerts (Investigate Within 24 Hours)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Rate limit triggers | > 50/hour | Review rate limit settings |
| Notification failures | > 5% | Check push notification config |
| WhatsApp message queue backlog | > 100 messages | Check processing pipeline |
| Cache hit rate | < 80% | Review caching strategy |

## Log-Based Alerts

Monitor structured logs for:

```
level: ERROR
type: application_error
module: ai_request (success: false)
type: ai_request (success: false)
type: sync_failure
```

## Dashboard Metrics

Key metrics to display:
- Requests per minute
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- AI request success rate
- Active connections
- Database query latency
- Sync queue depth

## Notification Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | PagerDuty / SMS | Immediate |
| Warning | Slack / Email | 1 hour |
| Info | Email digest | Daily |
