
  # Implement Plan

  This is a code bundle for Implement Plan. The original project is available at https://www.figma.com/design/uK1aIAmGdBEnqGuUlyMa20/Implement-Plan.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  # beantoanso
  
  ## Triển khai trên aaPanel (aaPanel Deployment)

  Dự án hỗ trợ chạy và deploy tự động trên aaPanel bằng công cụ quản lý tiến trình PM2.

  ### Yêu cầu hệ thống
  - Node.js (phiên bản 18 trở lên được khuyến nghị)
  - `pnpm` cài đặt toàn hệ thống (nếu chưa có, script deploy sẽ tự động cài)
  - `pm2` cài đặt toàn hệ thống (nếu chưa có, script deploy sẽ tự động cài)

  ### Các bước triển khai
  1. Đảm bảo cấu hình môi trường nằm trong file `.env` ở thư mục gốc (hoặc copy từ `.env.example`).
  2. Cấp quyền thực thi và chạy script deploy:
     ```bash
     chmod +x deploy.sh
     ./deploy.sh
     ```
  
  ### Quản lý quy trình PM2
  - Xem danh sách và trạng thái: `pm2 list`
  - Xem log hoạt động: `pm2 logs beantoanso`
  - Reload ứng dụng không gián đoạn: `pm2 reload beantoanso`
  - Dừng ứng dụng: `pm2 stop beantoanso`