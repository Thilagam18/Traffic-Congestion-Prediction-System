#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "--- Installing root server dependencies ---"
npm install --legacy-peer-deps 2>/dev/null || npm install || true

echo "--- Installing server dependencies ---"
cd server
npm install
cd ..

echo "--- Installing frontend dependencies ---"
cd frontend
npm install --legacy-peer-deps

echo "--- Patching react-scripts for webpack-dev-server v5 compatibility ---"
DEVSERVER_CONFIG="node_modules/react-scripts/config/webpackDevServer.config.js"
START_SCRIPT="node_modules/react-scripts/scripts/start.js"

# Patch webpackDevServer.config.js: replace v4 hooks with v5 setupMiddlewares
if grep -q "onBeforeSetupMiddleware" "$DEVSERVER_CONFIG" 2>/dev/null; then
  echo "  Applying webpackDevServer.config.js patch..."
  node -e "
    const fs = require('fs');
    let src = fs.readFileSync('$DEVSERVER_CONFIG', 'utf8');
    // Replace https option
    src = src.replace(/\bhttps: getHttpsConfig\(\),/, \"server: getHttpsConfig() ? { type: 'https', options: getHttpsConfig() } : { type: 'http' },\");
    // Replace old hooks with setupMiddlewares
    src = src.replace(
      /onBeforeSetupMiddleware\(devServer\) \{[\s\S]*?onAfterSetupMiddleware\(devServer\) \{[\s\S]*?\},/,
      \`setupMiddlewares(middlewares, devServer) {
      devServer.app.use(evalSourceMapMiddleware(devServer));
      const fs2 = require('fs');
      const paths2 = require('./paths');
      if (fs2.existsSync(paths2.proxySetup)) {
        require(paths2.proxySetup)(devServer.app);
      }
      const redirectServedPath2 = require('react-dev-utils/redirectServedPathMiddleware');
      const noopServiceWorkerMiddleware2 = require('react-dev-utils/noopServiceWorkerMiddleware');
      devServer.app.use(redirectServedPath2(paths2.publicUrlOrPath));
      devServer.app.use(noopServiceWorkerMiddleware2(paths2.publicUrlOrPath));
      return middlewares;
    },\`
    );
    fs.writeFileSync('$DEVSERVER_CONFIG', src);
    console.log('  webpackDevServer.config.js patched.');
  "
else
  echo "  webpackDevServer.config.js already patched, skipping."
fi

# Patch start.js: replace devServer.close() with devServer.stop()
if grep -q "devServer\.close()" "$START_SCRIPT" 2>/dev/null; then
  echo "  Applying start.js patch..."
  sed -i 's/devServer\.close()/devServer.stop()/g' "$START_SCRIPT"
  echo "  start.js patched."
else
  echo "  start.js already patched, skipping."
fi

cd ..
echo "--- Applying database schema ---"
psql "$DATABASE_URL" <<'SQL'
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(50)  NOT NULL DEFAULT 'user',
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
SQL

echo "=== Post-merge setup complete ==="
