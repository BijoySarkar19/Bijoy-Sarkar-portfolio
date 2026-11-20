# ☸️ Kubernetes Deployment Guide — Bijoy Sarkar Portfolio OS

Production-grade Kubernetes manifests and orchestration for **Bijoy Sarkar Portfolio OS**, supporting local clusters (**Kind**, **Minikube**, **k3s**) and managed cloud Kubernetes (**GKE**, **EKS**, **AKS**).

---

## 📁 Manifests Architecture

```
k8s/
├── namespace.yaml           # Dedicated 'portfolio' namespace
├── configmap.yaml           # Non-sensitive runtime environment variables (PORT: 4173)
├── secret.yaml.example      # Template for sensitive credentials & SMTP app password
├── secret.yaml              # Local secret instance (Git-ignored)
├── pvc.yaml                 # PersistentVolumeClaim for SQLite dev.db & assets
├── deployment.yaml          # Single-replica Deployment with health probes & resource limits
├── service.yaml             # NodePort Service exposing port 4173 (NodePort: 32173)
├── kustomization.yaml       # Kustomize manifest bundle
└── README.md                # Deployment documentation and troubleshooting
```

---

## 🚀 Quick Start Deployment

### 1. Build and Load Docker Image into Cluster

```bash
# Build the production Docker image locally
docker build -t bijoy-sarkar-portfolio:latest .

# If using Kind (local development cluster in Docker):
# On Windows (cmd.exe binary pipe):
cmd.exe /c "docker save bijoy-sarkar-portfolio:latest | docker exec -i kind-control-plane ctr -n k8s.io images import -"

# On Linux / macOS / Bash:
docker save bijoy-sarkar-portfolio:latest | docker exec -i kind-control-plane ctr -n k8s.io images import -
```

### 2. Generate Secrets Manifest

Generate `k8s/secret.yaml` automatically from your local `.env`:

```bash
node scripts/gen-k8s-secret.cjs
```

Or manually copy and edit from template:

```bash
cp k8s/secret.yaml.example k8s/secret.yaml
```

### 3. Apply Manifests

```bash
# Apply using Kustomize (recommended)
kubectl apply -k k8s/

# Or apply individual manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 4. Verify Pod Status & Health

```bash
# Watch pod rollout
kubectl get pods -n portfolio -w

# Check services and NodePort
kubectl get svc -n portfolio

# Check PVC binding
kubectl get pvc -n portfolio
```

### 5. Access the Application

#### Option A: Port-Forwarding (Recommended for Local Dev)

```bash
kubectl port-forward -n portfolio svc/portfolio-service 4173:4173
```

Open [http://localhost:4173](http://localhost:4173) in your browser.

#### Option B: NodePort Access

The service is exposed on NodePort `32173`. If your Kind/Minikube node exposes NodePorts, access via:
`http://<NODE-IP>:32173`

---

## 📬 Contact Form & Email Dispatch Architecture

When messages are submitted via the `/api/contact` endpoint within Kubernetes:
1. **Database Persistence**: Written directly to SQLite `/app/data/dev.db` backed by `portfolio-data-pvc`.
2. **CSV Audit Logging**: Appended to `/app/public/downloads/contact-submissions.csv`.
3. **Gmail SMTP Dispatch**: Dispatched to `bijoysarkar7252@gmail.com` via TLS/SSL (`smtp.gmail.com:465`) using credentials from `portfolio-secrets`.
4. **Google Sheets Sync**: Dispatched to Google Apps Script Webhook for instant spreadsheet replication.

---

## 🛠️ Management Commands

```bash
# Stream pod container logs
kubectl logs -n portfolio -l app=bijoy-portfolio -f

# Execute a shell inside the running container
kubectl exec -it -n portfolio $(kubectl get pod -n portfolio -l app=bijoy-portfolio -o jsonpath='{.items[0].metadata.name}') -- sh

# Restart deployment (rolling rollout)
kubectl rollout restart deployment/portfolio-deployment -n portfolio

# Teardown deployment
kubectl delete -k k8s/
```
