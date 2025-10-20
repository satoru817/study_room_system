#!/bin/bash

echo "🔨 React building..."
cd frontend
npm run build

echo "📦 Copy build file to SpringBoot..."
rm -rf ../StudyRoomReservation/src/main/resources/static/*
cp -r dist/* ../StudyRoomReservation/src/main/resources/static/

echo "✅ done！ you can run spring boot app by following command"
echo "   cd StudyRoomReservation && ./mvnw spring-boot:run"
