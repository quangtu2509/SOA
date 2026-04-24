/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'], // Font uốn lượn Serein Store
        sans: ['Inter', 'sans-serif'], // Font chữ thường dễ đọc
      },
      colors: {
        // Mã màu xịn sò từ file HTML của Trung
        cream: '#FDFBF7', // Nền web ấm áp
        card: '#F4EFE6', // Khung sản phẩm nhẹ nhàng
        accent: '#E87A3E', // Màu cam thương hiệu
        dark: '#3E3935', // Màu chữ than chì
        muted: '#8A837D' // Màu chữ xám mờ
      }
    },
  },
  plugins: [],
}