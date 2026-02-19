;/**
 * Pre-build environment variable validation
 * Ensures required env vars are set before building
 */

const requiredVars = [
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

const optionalVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'GITHUB_BOT_TOKEN',
];

const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.warn('\n⚠️  Missing required environment variables:');
  missing.forEach((v) => console.warn(`   - ${v}`));
  console.warn('\nPlease set them in your .env file.\n');
  // Don't exit with error - allow build to continue for CI/preview deployments
}

const missingOptional = optionalVars.filter((v) => !process.env[v]);
if (missingOptional.length > 0) {
  console.log('\nℹ️  Missing optional environment variables (some features may be disabled):');
  missingOptional.forEach((v) => console.log(`   - ${v}`));
  console.log('');
}

console.log('✅ Environment validation complete\n');
