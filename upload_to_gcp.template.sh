#!/bin/bash
# ==============================================================
# Looker Radar Chart Deployment Script
# ==============================================================
# To use this script:
# 1. Copy this file to upload_to_gcp.sh
# 2. Set your environment variables or modify the defaults below
# 3. Run ./upload_to_gcp.sh to deploy
# ==============================================================

# Use environment variables if set, otherwise use these defaults
# Override these by setting them before running the script:
# export GCP_ACCOUNT="your-account@example.com"
# export GCP_PROJECT="your-project-id"
# export GCP_BUCKET="gs://your-bucket/your-path"
GCP_ACCOUNT=${GCP_ACCOUNT:-"your-account@example.com"}
GCP_PROJECT=${GCP_PROJECT:-"your-project-id"}
GCP_BUCKET=${GCP_BUCKET:-"gs://your-bucket/radar-chart"}
MAKE_PUBLIC=${MAKE_PUBLIC:-"true"}

# Show configuration
echo "Deploying with the following settings:"
echo "- GCP Account: $GCP_ACCOUNT"
echo "- GCP Project: $GCP_PROJECT"
echo "- GCP Bucket: $GCP_BUCKET"
echo "- Make files public: $MAKE_PUBLIC"
echo

# Set GCP configuration
echo "Setting GCP configuration..."
gcloud config set account $GCP_ACCOUNT
gcloud config set project $GCP_PROJECT

# Build the project 
echo "Building project..."
npm run build

# Prepare public-read flag
PUBLIC_FLAG=""
if [ "$MAKE_PUBLIC" = "true" ]; then
  PUBLIC_FLAG="-a public-read"
fi

# Upload files
echo "Uploading files to $GCP_BUCKET..."
gsutil cp $PUBLIC_FLAG dist/index.js $GCP_BUCKET/index.js
gsutil cp $PUBLIC_FLAG dist/index.css $GCP_BUCKET/index.css
gsutil cp $PUBLIC_FLAG dist/index.json $GCP_BUCKET/index.json
gsutil cp $PUBLIC_FLAG dist/manifest.json $GCP_BUCKET/manifest.json
gsutil cp $PUBLIC_FLAG dist/radar-chart-icon.png $GCP_BUCKET/radar-chart-icon.png

echo "Upload complete!"
echo
echo "Your visualization is now deployed to: $GCP_BUCKET"
echo "Use this path when adding the custom visualization in Looker Studio."