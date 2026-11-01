# Gameshow Đố vui Sách Lời Chúa

Người chơi quét mã QR bằng điện thoại, nhập tên, không cần tài khoản nào.

## Chạy thử trên máy tính
1. Cài Node.js bản 18 trở lên (https://nodejs.org).
2. Mở terminal trong thư mục này: `node server.js`
3. Quản trò mở http://localhost:3000/host (mật khẩu mặc định: `giaoly`).
   Điện thoại phải cùng mạng Wi-Fi và vào http://<IP-máy-tính>:3000/ (mã QR trên màn hình host dùng địa chỉ bạn đang mở,
   nên hãy mở host bằng địa chỉ IP thay vì localhost để mã QR đúng).

## Đưa lên mạng (Render, miễn phí)
1. Tạo tài khoản tại https://github.com và tải thư mục này lên một kho (repository) mới.
2. Tạo tài khoản tại https://render.com, chọn New > Web Service, nối với kho vừa tạo.
3. Điền: Runtime = Node, Build Command = (để trống), Start Command = `node server.js`.
4. Mục Environment, thêm biến `HOST_PASSWORD` với mật khẩu quản trò của bạn.
5. Bấm Deploy. Render cấp địa chỉ dạng https://ten-ban-dat.onrender.com
6. Quản trò vào `https://.../host`, nhập mật khẩu. Mã QR sẽ trỏ tới địa chỉ công khai để mọi người chơi.

## Lưu ý
- Gói miễn phí của Render "ngủ" sau một thời gian không dùng. Hãy mở trang host trước giờ chơi khoảng 1 phút.
- Dữ liệu ván chơi nằm trong bộ nhớ máy chủ. Máy chủ khởi động lại thì ván chơi bị mất.
- Câu hỏi, thời gian (TIME) và cách tính điểm nằm ở đầu file server.js.
