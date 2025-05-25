# --- Stage 1: Frontend Build ---
FROM node:18-alpine as frontend_builder

WORKDIR /app/frontend

# package.json과 package-lock.json 복사 및 의존성 설치
COPY frontend/package*.json ./
RUN npm install

# 모든 프론트엔드 소스 코드 복사
COPY frontend/ .

# Vite를 사용하여 프론트엔드 빌드
RUN npm run build


# --- Stage 2: Nginx Server ---
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY deploy/nginx.conf /etc/nginx/nginx.conf

# 1단계에서 빌드된 프론트엔드 정적 파일을 Nginx의 웹 루트로 복사
COPY --from=frontend_builder /app/frontend/dist /usr/share/nginx/html/

# 컨테이너 80번 포트 노출
EXPOSE 80

# Nginx를 포그라운드로 실행
CMD ["nginx", "-g", "daemon off;"]