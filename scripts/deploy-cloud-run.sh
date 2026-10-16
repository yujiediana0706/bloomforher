#!/bin/bash
# ReBloom AI — one-command Cloud Run deploy script

set -e

PROJECT_ID="buildercup2026-511504"
REGION="asia-southeast1"
SERVICE_NAME="rebloom-ai"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== ReBloom AI Cloud Run deploy ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# 1. Build the Docker image
echo "[1/4] Building the Docker image..."
docker build -t ${IMAGE_NAME} .

# 2. Push the image to GCR
echo "[2/4] Pushing the image to GCR..."
docker push ${IMAGE_NAME}

# 3. Deploy to Cloud Run
echo "[3/4] Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --set-env-vars "AGENT_ENDPOINT_ASSESSMENT=${AGENT_ENDPOINT_ASSESSMENT}" \
  --set-env-vars "AGENT_ENDPOINT_COACH=${AGENT_ENDPOINT_COACH}" \
  --set-env-vars "AGENT_ENDPOINT_MEMORY=${AGENT_ENDPOINT_MEMORY}" \
  --set-env-vars "AGENT_ENDPOINT_PROACTIVE=${AGENT_ENDPOINT_PROACTIVE}" \
  --set-env-vars "AGENT_ENDPOINT_MENTOR_MATCH=${AGENT_ENDPOINT_MENTOR_MATCH}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300

# 4. Get the service URL
echo "[4/4] Fetching the service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "=== Deploy complete ==="
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "Environment variables configured:"
echo "  GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
echo "  AGENT_ENDPOINT_ASSESSMENT=${AGENT_ENDPOINT_ASSESSMENT:+configured}"
echo "  AGENT_ENDPOINT_COACH=${AGENT_ENDPOINT_COACH:+configured}"
echo "  AGENT_ENDPOINT_MEMORY=${AGENT_ENDPOINT_MEMORY:+configured}"
echo "  AGENT_ENDPOINT_PROACTIVE=${AGENT_ENDPOINT_PROACTIVE:+configured}"
echo "  AGENT_ENDPOINT_MENTOR_MATCH=${AGENT_ENDPOINT_MENTOR_MATCH:+configured}"
