# Dùng bản Node 18 alpine siêu nhẹ
FROM node:18-alpine

# Khai báo thư mục làm việc trong container
WORKDIR /app

# Copy 2 file package vào trước để cài thư viện
COPY package*.json ./
RUN npm install

# Copy toàn bộ code còn lại vào
COPY . .

# Mở cửa sổ giao tiếp cổng 8003
EXPOSE 8003

# Lệnh khởi động server
CMD ["node", "server.js"]