# Monitoring Setup for ITSM Integration API

This directory contains configuration files and instructions for setting up monitoring for the ITSM Integration API deployed on Smithery.

## Monitoring Options

### 1. Prometheus + Grafana

Prometheus is used for metrics collection and Grafana for visualization.

#### Setup Steps:

1. **Enable Prometheus metrics in your API**

   Add the following code to your backend:

   ```javascript
   const promClient = require('prom-client');
   const register = promClient.register;

   // Create metrics
   const httpRequestDurationMicroseconds = new promClient.Histogram({
     name: 'http_request_duration_ms',
     help: 'Duration of HTTP requests in ms',
     labelNames: ['method', 'route', 'status_code'],
     buckets: [0.1, 5, 15, 50, 100, 500]
   });

   const integrationHealthStatus = new promClient.Gauge({
     name: 'integration_health_status',
     help: 'Health status of integrations (1=healthy, 0=unhealthy)',
     labelNames: ['integration_id', 'integration_name', 'integration_type']
   });

   // Add metrics endpoint to your Express app
   app.get('/metrics', async (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(await register.metrics());
   });
   ```

2. **Deploy Prometheus**

   Create a `prometheus.yml` file:

   ```yaml
   global:
     scrape_interval: 15s

   scrape_configs:
     - job_name: 'itsm-api'
       static_configs:
         - targets: ['your-itsm-api-host:5000']
   ```

3. **Deploy Grafana**

   Connect Grafana to Prometheus and create dashboards for:
   - API request duration
   - Error rates
   - Integration health status
   - Authentication success/failure rates

### 2. Cloud-Based Monitoring Solutions

#### AWS CloudWatch

If deployed on AWS:

1. Install the CloudWatch agent on your servers
2. Create a CloudWatch dashboard with:
   - API Gateway metrics (if using API Gateway)
   - EC2/ECS metrics (if applicable)
   - Custom metrics from your application

#### Google Cloud Monitoring

If deployed on Google Cloud:

1. Enable Cloud Monitoring API
2. Use the Google Cloud client libraries to send custom metrics
3. Set up dashboards and alerts

### 3. Uptime Monitoring

Use services like:

- UptimeRobot
- Pingdom
- StatusCake

Configure them to monitor key endpoints:
- `/health` - Overall API health
- `/api/integration` - Integration functionality
- `/api/auth/login` - Authentication system

## Alert Setup

### Critical Alerts

Set up immediate notification for:

1. Service unavailability
2. High error rates (>5% of requests)
3. Authentication system failures
4. Database connection issues

### Warning Alerts

Set up notifications for:

1. High response times (>500ms)
2. Integration health check failures
3. High resource utilization (CPU, memory)
4. Unusual traffic patterns

## Logging

Enhance logging for monitoring:

1. Use structured logging (JSON format)
2. Include request IDs for traceability
3. Log important business events
4. Implement log aggregation (ELK Stack, Graylog, etc.)

## Implementation Checklist

- [ ] Set up basic endpoint monitoring
- [ ] Configure metrics collection
- [ ] Create visualization dashboards
- [ ] Set up alerting rules
- [ ] Test alerts and notifications
- [ ] Document incident response procedures

## Useful Commands

```bash
# Check Prometheus targets
curl http://your-prometheus-server:9090/api/v1/targets

# Check current metrics from the API
curl http://your-itsm-api:5000/metrics

# Test alert manager
curl -H "Content-Type: application/json" -d '[{"labels":{"alertname":"TestAlert"}}]' http://your-alertmanager:9093/api/v1/alerts
``` 