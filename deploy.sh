#!/bin/bash
set -e  # エラーが起きたら即座に停止
set -u  # 未定義変数を使ったらエラー
set -o pipefail  # パイプ内のエラーも検知

# Next.js のビルド
./next-build.sh

# Spring Boot のビルド
cd backend
mvn clean package -DskipTests

# jar をデプロイ
scp -i ~/Downloads/LightsailDefaultKey-ap-northeast-1.pem \
  target/StudyRoomReservation-0.0.1-SNAPSHOT.jar \
  ec2-user@13.114.217.175:/opt/studyroom/app.jar

# サーバー上でプロセス再起動
ssh -i ~/Downloads/LightsailDefaultKey-ap-northeast-1.pem ec2-user@13.114.217.175 << 'EOF'
sudo systemctl restart studyroom.service
EOF

echo "✅ デプロイ完了"