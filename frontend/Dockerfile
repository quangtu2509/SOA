# ==========================================
# GIAI ĐOẠN 1: BUILD GIAO DIỆN REACT (VITE)
# ==========================================
FROM node:20-alpine AS build-stage
# Tạo thư mục làm việc
WORKDIR /app

# Cài đặt thư viện
COPY package*.json ./
RUN npm install

# Copy toàn bộ code vào và tiến hành Build
COPY . .
RUN npm run build

# ==========================================
# GIAI ĐOẠN 2: TRIỂN KHAI VỚI NGINX
# ==========================================
FROM nginx:alpine

# Xóa cấu hình mặc định của Nginx
RUN rm /etc/nginx/conf.d/default.conf

# 1. Copy file cấu hình nginx.conf tụi mình vừa viết ở Bước 2 vào container
COPY nginx.conf /etc/nginx/conf.d/

# 2. Copy cục 'dist' (kết quả của Giai đoạn 1) qua thư mục chạy web của Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Mở cổng 80 cho khách hàng truy cập
EXPOSE 80 

# Chạy Nginx ẩn dưới background
CMD ["nginx", "-g", "daemon off;"]