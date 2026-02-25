# GCP + Vercel Pro Low-Cost Deployment

This profile is for:

- Frontend on **Vercel Pro**
- Backend on **Google Cloud Run** (API + worker)
- **Firestore + Cloud Storage** managed by Firebase/GCP
- Very low usage pattern (monthly meetings / on-demand)

## Expected Cost Envelope

For small pilot usage with scale-to-zero:

- Vercel Pro: ~$20/mo
- Cloud Run + Firestore + Storage: often ~$0-5/mo at low usage
- Typical total: **~$20-25/mo**

## Cost Strategy

1. Cloud Run `min instances = 0` for API and worker.
2. Keep `max instances` small (`API=2`, `worker=1`) for budget control.
3. Use storage lifecycle policy (e.g., auto-delete audio after 30 days).
4. Only run monthly readiness checks before meetings.

## 1) Configure Environment

```bash
cp .env.gcp.vercel.example .env.gcp.vercel
```

Set at least:

- `PROJECT_ID`
- `REGION`
- `AR_REPO`
- `VERCEL_FRONTEND_URL`
- `GCS_BUCKET_NAME`

## 2) Deploy Backend

```bash
./scripts/deploy_gcp_vercel_low_cost.sh .env.gcp.vercel
```

This will:

- Build/push API and worker images to Artifact Registry
- Deploy worker private Cloud Run service
- Deploy public API Cloud Run service
- Apply env vars including `CORS_ORIGIN` and `WORKER_ENDPOINT`

## 3) Apply Low-Cost Controls

```bash
./scripts/configure_gcp_low_cost_controls.sh .env.gcp.vercel
```

This reasserts:

- Scale-to-zero settings
- Storage lifecycle policy (retention window)

## 4) Wire Vercel

In Vercel project settings:

- Set API base/config to Cloud Run API URL output from deploy script
- Redeploy frontend

## 5) Monthly/On-Demand Readiness

Run before each meeting:

```bash
./scripts/check_gcp_monthly_readiness.sh .env.gcp.vercel
```

Recommended quick functional check:

- Log in
- Create a meeting
- Save draft minutes
- Run approval flow

## Operational Notes

- You do **not** need to manually shut down Cloud Run between meetings.
- With `min instances = 0`, Cloud Run scales to zero when idle.
- Biggest cost lever is storage retention for audio files.
