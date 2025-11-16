# Autoscaling Configuration

This directory contains Kubernetes autoscaling configurations for the Luneo Platform.

## Files

- `hpa-backend.yaml` - Horizontal Pod Autoscaler for backend API
- `hpa-worker.yaml` - Horizontal Pod Autoscaler for worker service
- `worker-concurrency-config.md` - Worker concurrency policy and configuration

## Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- Metrics Server installed
- Prometheus Operator (optional, for custom metrics)

## Installation

### 1. Install Metrics Server

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Deploy HPA Configurations

```bash
# Apply backend HPA
kubectl apply -f hpa-backend.yaml

# Apply worker HPA
kubectl apply -f hpa-worker.yaml
```

### 3. Verify HPA Status

```bash
# Check backend HPA
kubectl get hpa luneo-backend-hpa -n luneo-production

# Check worker HPA
kubectl get hpa luneo-worker-hpa -n luneo-production

# Watch HPA in real-time
kubectl get hpa -n luneo-production -w
```

## Configuration Details

### Backend API Autoscaling

**Scaling Metrics:**
- CPU utilization: Target 70%
- Memory utilization: Target 80%
- Request rate: Target 1000 req/s per pod

**Scaling Behavior:**
- **Scale Up**: Aggressive (double replicas or +5 pods per minute)
- **Scale Down**: Conservative (reduce by 50% or -2 pods per 5 minutes)
- **Min Replicas**: 3
- **Max Replicas**: 50

**Use Case**: Handle 10k concurrent users for read-only embed widget flows

### Worker Autoscaling

**Scaling Metrics:**
- CPU utilization: Target 75%
- Memory utilization: Target 85%
- Queue depth: Target 50 jobs per worker
- Active jobs: Target 10 jobs per worker

**Scaling Behavior:**
- **Scale Up**: Moderate (increase by 50% or +2 pods per 2 minutes)
- **Scale Down**: Very conservative (reduce by 25% or -1 pod per 10 minutes)
- **Min Replicas**: 2
- **Max Replicas**: 20

**Use Case**: Handle 500 concurrent render jobs

## Custom Metrics

To use custom metrics (request rate, queue depth), you need:

1. **Prometheus Operator** installed
2. **ServiceMonitor** for exposing metrics
3. **PrometheusAdapter** for converting Prometheus metrics to Kubernetes metrics

### Example ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: luneo-backend-metrics
  namespace: luneo-production
spec:
  selector:
    matchLabels:
      app: luneo-backend
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
```

## Monitoring

### View HPA Status

```bash
# Detailed HPA status
kubectl describe hpa luneo-backend-hpa -n luneo-production
kubectl describe hpa luneo-worker-hpa -n luneo-production

# HPA events
kubectl get events --field-selector involvedObject.name=luneo-backend-hpa -n luneo-production
```

### Key Metrics to Monitor

1. **HPA Status**
   - Current replicas
   - Desired replicas
   - Current metrics values
   - Scaling events

2. **Pod Metrics**
   - CPU usage per pod
   - Memory usage per pod
   - Request rate per pod

3. **Application Metrics**
   - Queue depth (workers)
   - Active jobs (workers)
   - Request latency (backend)
   - Error rate (backend)

## Troubleshooting

### HPA Not Scaling

1. **Check Metrics Server**
   ```bash
   kubectl top nodes
   kubectl top pods -n luneo-production
   ```

2. **Check HPA Status**
   ```bash
   kubectl describe hpa luneo-backend-hpa -n luneo-production
   ```
   Look for:
   - `AbleToScale: True`
   - `ScalingActive: True`
   - Current metrics values

3. **Check Resource Requests**
   ```bash
   kubectl describe deployment luneo-backend -n luneo-production
   ```
   Ensure CPU/memory requests are set

### HPA Scaling Too Aggressively

1. **Increase stabilization window**
2. **Adjust scaling policies** (reduce percentage or pod count)
3. **Review target utilization** (may be too low)

### HPA Not Scaling Down

1. **Check minReplicas** (may be set too high)
2. **Review scaleDown policies** (may be too conservative)
3. **Check if pods are under load** (may still need them)

## Best Practices

1. **Set appropriate min/max replicas**
   - Min: Handle baseline traffic
   - Max: Prevent runaway costs

2. **Use multiple metrics**
   - CPU + Memory + Custom metrics
   - Prevents scaling on single metric spikes

3. **Configure scaling behavior**
   - Aggressive scale-up for responsiveness
   - Conservative scale-down to prevent thrashing

4. **Monitor and adjust**
   - Review scaling events regularly
   - Adjust targets based on actual usage
   - Test scaling behavior under load

5. **Set resource requests/limits**
   - Requests: Used for scheduling and scaling decisions
   - Limits: Prevent resource exhaustion

## Cost Optimization

### Right-Sizing

- Start with conservative min replicas
- Set reasonable max replicas
- Monitor actual usage and adjust

### Scaling Policies

- Use percentage-based scaling for gradual changes
- Use pod-based scaling for predictable increments
- Balance responsiveness with cost

### Resource Allocation

- Set appropriate CPU/memory requests
- Use VPA (Vertical Pod Autoscaler) for optimization
- Review and adjust regularly

## References

- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [HPA Best Practices](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#support-for-configurable-scaling-behavior)
- [VPA Documentation](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler)
