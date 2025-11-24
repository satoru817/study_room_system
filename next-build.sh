#!/bin/bash

echo "🔨 Next.js building..."
cd frontend
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.jsバージョンを使用
nvm use v22.13.0

npm run build

echo "📦 Copy build files to SpringBoot..."
rm -rf ../backend/src/main/resources/static/*

# Next.jsのoutputディレクトリをコピー
# (next.config.jsでoutput: 'export'を設定している場合)
if [ -d "out" ]; then
    cp -r out/* ../backend/src/main/resources/static/
    echo "✅ Copied from 'out' directory (static export)"
# スタンドアロンビルドの場合
elif [ -d ".next/standalone" ]; then
    echo "⚠️  Warning: Standalone build detected."
    echo "   For Spring Boot integration, please use static export."
    echo "   Add 'output: \"export\"' to next.config.js"
    exit 1
# 通常の.nextビルドの場合
else
    echo "⚠️  Warning: No static export found."
    echo "   Please configure next.config.js with:"
    echo "   output: 'export'"
    exit 1
fi

echo "✅ done！ you can run spring boot app by following command"
echo "   cd backend && ./mvnw spring-boot:run"cd 