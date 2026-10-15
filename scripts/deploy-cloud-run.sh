#!/bin/bash
# ReBloom AI · 她径 — Cloud Run 一键部署脚本

set -e

PROJECT_ID="buildercup2026-511504"
REGION="asia-southeast1"
SERVICE_NAME="rebloom-ai"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== ReBloom AI Cloud Run 部署 ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# 1. 构建 Docker 镜像
echo "[1/4] 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME} .

# 2. 推送镜像到 GCR
echo "[2/4] 推送镜像到 GCR..."
docker push ${IMAGE_NAME}

# 3. 部署到 Cloud Run
echo "[3/4] 部署到 Cloud Run..."
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

# 4. 获取服务 URL
echo "[4/4] 获取服务 URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "=== 部署完成 ==="
echo "服务 URL: ${SERVICE_URL}"
echo ""
echo "环境变量已配置:"
echo "  GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
echo "  AGENT_ENDPOINT_ASSESSMENT=${AGENT_ENDPOINT_ASSESSMENT:+已配置}"
echo "  AGENT_ENDPOINT_COACH=${AGENT_ENDPOINT_COACH:+已配置}"
echo "  AGENT_ENDPOINT_MEMORY=${AGENT_ENDPOINT_MEMORY:+已配置}"
echo "  AGENT_ENDPOINT_PROACTIVE=${AGENT_ENDPOINT_PROACTIVE:+已配置}"
echo "  AGENT_ENDPOINT_MENTOR_MATCH=${AGENT_ENDPOINT_MENTOR_MATCH:+已配置}"
