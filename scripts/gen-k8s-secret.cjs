const fs = require('fs');
require('dotenv').config();

const content = `apiVersion: v1
kind: Secret
metadata:
  name: portfolio-secrets
  namespace: portfolio
  labels:
    app.kubernetes.io/name: bijoy-sarkar-portfolio
type: Opaque
stringData:
  DATABASE_URL: "file:/app/data/dev.db"
  NEXTAUTH_SECRET: "${process.env.NEXTAUTH_SECRET || 'bijoy-sarkar-portfolio-auth-secret-key-2026-fallback-secure-deterministic'}"
  ADMIN_USERNAME: "${process.env.ADMIN_USERNAME || 'Bijoy19'}"
  ADMIN_EMAIL: "${process.env.ADMIN_EMAIL || 'bijoysarkar7252@gmail.com'}"
  ADMIN_PASSWORD: "${process.env.ADMIN_PASSWORD || 'Teriki77!'}"
  RATE_LIMIT_SALT: "${process.env.RATE_LIMIT_SALT || 'custom-production-salt'}"
  EMAIL_USER: "${process.env.EMAIL_USER || 'bijoysarkar7252@gmail.com'}"
  EMAIL_PASS: "${process.env.EMAIL_PASS || ''}"
  RECAPTCHA_SECRET_KEY: "${process.env.RECAPTCHA_SECRET_KEY || ''}"
`;

fs.writeFileSync('k8s/secret.yaml', content, 'utf8');
console.log('Successfully generated k8s/secret.yaml from .env');
