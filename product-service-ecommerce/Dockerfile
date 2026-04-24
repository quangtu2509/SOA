# Dùng bản Node.js nhẹ nhất
FROM node:18-alpine

# Tạo thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy các file cấu hình thư viện vào trước
COPY package*.json ./

# Cài đặt thư viện (chỉ cài dependencies, bỏ qua devDependencies để nhẹ image)
RUN npm install --production

# Copy toàn bộ source code vào
COPY . .

# Mở cổng 8001 để giao tiếp
EXPOSE 8001

# Lệnh khởi động app
CMD ["node", "server.js"]