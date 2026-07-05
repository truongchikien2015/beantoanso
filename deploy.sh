#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Bắt đầu quá trình triển khai Bé An Toàn Số trên aaPanel ===${NC}"

# 1. Kiểm tra file .env
if [ ! -f .env ] && [ ! -f .env.production ]; then
    echo -e "${YELLOW}[!] Cảnh báo: Không tìm thấy file cấu hình môi trường (.env hoặc .env.production)${NC}"
    if [ -f .env.example ]; then
        echo -e "${YELLOW}[*] Đang sao chép .env.example sang .env...${NC}"
        cp .env.example .env
        echo -e "${RED}[!] Vui lòng cấu hình các giá trị trong file .env trước khi chạy lại script.${NC}"
        exit 1
    else
        echo -e "${RED}[X] Lỗi: Không tìm thấy file .env.example để tạo file cấu hình môi trường.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[✓] Tìm thấy file cấu hình môi trường (.env).${NC}"
fi

# 2. Kiểm tra pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}[!] Cảnh báo: Không tìm thấy pnpm. Đang tự động cài đặt pnpm toàn hệ thống...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}[✓] Đã xác nhận pnpm hoạt động: $(pnpm -v)${NC}"

# 3. Đồng bộ mã nguồn từ Git (Tùy chọn)
if [ -d .git ]; then
    echo -e "${YELLOW}[*] Đang kiểm tra cập nhật từ Git...${NC}"
    # Lấy nhánh hiện tại
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "[*] Đang kéo mã nguồn mới nhất của nhánh: ${CURRENT_BRANCH}..."
    git pull origin "$CURRENT_BRANCH" || echo -e "${YELLOW}[!] Cảnh báo: Không thể pull code từ remote repository. Tiếp tục với mã nguồn hiện tại.${NC}"
fi

# 4. Cài đặt các thư viện phụ thuộc (dependencies)
echo -e "${YELLOW}[*] Đang cài đặt dependencies...${NC}"
pnpm install

# 5. Build dự án Next.js
echo -e "${YELLOW}[*] Đang build dự án Next.js...${NC}"
pnpm build
echo -e "${GREEN}[✓] Build dự án Next.js thành công!${NC}"

# 6. Quản lý và khởi chạy quy trình bằng PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}[!] Cảnh báo: Không tìm thấy PM2. Đang tự động cài đặt PM2...${NC}"
    npm install -g pm2
fi

echo -e "${YELLOW}[*] Đang quản lý quy trình chạy bằng PM2...${NC}"
if pm2 describe beantoanso &> /dev/null; then
    echo -e "${YELLOW}[*] Ứng dụng 'beantoanso' đã chạy trước đó. Tiến hành reload không gián đoạn...${NC}"
    pm2 reload beantoanso --update-env
else
    echo -e "${GREEN}[*] Khởi chạy ứng dụng 'beantoanso' mới bằng file config...${NC}"
    pm2 start ecosystem.config.js
fi

# Lưu trạng thái PM2 hiện tại để tự động chạy lại khi server khởi động lại (nếu aaPanel khởi động lại)
pm2 save

echo -e "${GREEN}=== Triển khai hoàn tất thành công! ===${NC}"
echo -e "${GREEN}Ứng dụng đang chạy. Bạn có thể kiểm tra logs bằng lệnh: pm2 logs beantoanso${NC}"
