# AWS later — do not configure yet unless needed

The frontend already supports an `aws` media provider through a public base URL (ideally CloudFront).

Do not place AWS credentials in the frontend. A future staff upload flow should request a presigned upload URL from a trusted backend/serverless function, upload directly to S3, then save the resulting object key/URL in Supabase lesson metadata.

Recommended eventual responsibility split:
- Supabase: users, permissions, lesson metadata, FAQs, resources, guide metadata
- S3: large video objects
- CloudFront: public/controlled video delivery
- Netlify: frontend deployment and optional serverless functions
