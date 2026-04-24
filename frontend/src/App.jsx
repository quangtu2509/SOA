import React, { useState, useEffect } from 'react';

const USER_ID = "123"; 

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
  const savedCart = localStorage.getItem('serein_cart');
  return savedCart ? JSON.parse(savedCart) : [];
});
  const [walletBalance, setWalletBalance] = useState(0); 
  const [notification, setNotification] = useState(null);
  
  // BƯỚC 3: State quản lý hiệu ứng Loading của Saga
  const [isProcessing, setIsProcessing] = useState(false);

  // Đoạn cũ đang có:
  useEffect(() => {
    fetchProducts();
    fetchWalletBalance();
  }, []);

  // --- THÊM ĐOẠN NÀY VÀO NGAY ĐÂY ---
  // Cứ mỗi khi 'cart' có biến động (thêm, bớt, xóa), tự động lưu xuống ổ cứng
  useEffect(() => {
    localStorage.setItem('serein_cart', JSON.stringify(cart));
  }, [cart]);
  // ---------------------------------

  const fetchProducts = async () => {
    try {
      // Đã cập nhật Link Render của Product Service
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.status === 'success') setProducts(data.data);
    } catch (err) { console.error("Lỗi kết nối Product Service:", err); }
  };

  const fetchWalletBalance = async () => {
    try {
      // Đã cập nhật Link Render của Payment Service
      const res = await fetch('/api/payments/wallets/' + USER_ID);
      const data = await res.json();
      if (data.status === 'success') setWalletBalance(data.data.balance);
    } catch (err) { console.error("Lỗi kết nối Payment Service:", err); }
  };

  // --- LOGIC TRÙM CUỐI: XỬ LÝ THANH TOÁN (SAGA ORCHESTRATOR) ---
  const handleCheckout = async () => {
    setIsProcessing(true); // Bật màn hình loading xịn sò lên
    setNotification(null);

    try {
      // Ép kiểu dữ liệu giỏ hàng cho đúng định dạng Order Service cần
      const orderItems = cart.map(item => ({ productId: item.id, quantity: item.quantity }));
      
      // Đã cập nhật Link Render của Order Service
      // Bắn API sang cổng 8002 (Order Service) thông qua Nginx chỉ đường
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, items: orderItems })
      });
      
      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        // Nếu Saga chạy mượt mà: Báo thành công, xóa giỏ hàng, cập nhật lại tiền và kho
        setNotification('🎉 Thanh toán thành công! Serein đang chuẩn bị hàng cho bạn.');
        setCart([]);
        fetchWalletBalance();
        fetchProducts();
        setCurrentTab('home'); // Chuyển về trang chủ
      } else {
        // Nếu Saga thất bại (VD: Hết tiền): Báo lỗi để user biết hệ thống đã Rollback
        setNotification(`❌ Giao dịch thất bại: ${data.message} (Đã hoàn tác kho)`);
      }
    } catch (error) {
      setNotification('🚨 Lỗi máy chủ. Vui lòng kiểm tra lại Order Service trên Render.');
    } finally {
      // Tắt màn hình loading sau 1.5 giây để user kịp nhìn hiệu ứng
      setTimeout(() => {
        setIsProcessing(false);
        setTimeout(() => setNotification(null), 4000); // Tắt toast sau 4s
      }, 1500); 
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setNotification(`Đã thêm ${product.name} vào giỏ!`);
    setTimeout(() => setNotification(null), 2000);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // --- HÀM TĂNG GIẢM SỐ LƯỢNG ---
  const decreaseQuantity = (productId) => {
    setCart(cart.map(item => {
      if (item.id === productId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  const increaseQuantity = (productId) => {
    setCart(cart.map(item => {
      if (item.id === productId && item.quantity < item.stock) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    }));
  };

  const totalCartValue = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E3935] font-sans antialiased pb-20 relative">
      
      {/* HIỆU ỨNG LOADING SAGA ĐẸP MẮT */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[#FDFBF7]/90 flex flex-col items-center justify-center z-[100] backdrop-blur-sm transition-all">
          <div className="relative flex justify-center items-center">
             <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-[#E87A3E]"></div>
             <span className="absolute text-3xl">✨</span>
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif' }} className="text-4xl text-dark mt-8 mb-3">Saga Orchestrator</h1>
          <p className="text-[#8A837D] font-medium tracking-widest uppercase text-sm animate-pulse">Hệ thống đang xử lý giao dịch liên miền...</p>
        </div>
      )}

      {/* HEADER */}
      <header className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center border-b border-[#EBE3D5]">
        <h1 
          style={{ fontFamily: '"Playfair Display", serif' }} 
          className="text-4xl font-black text-[#E87A3E] cursor-pointer" 
          onClick={() => setCurrentTab('home')}
        >
          Serein Store.
        </h1>
        
        <div className="flex gap-4 items-center">
            <button 
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${currentTab === 'cart' ? 'bg-[#E87A3E] text-white shadow-md' : 'bg-[#F4EFE6] hover:bg-[#EBE3D5]'}`}
              onClick={() => setCurrentTab('cart')}
            >
                <span className="text-xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-dark text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FDFBF7]">
                    {cartCount}
                  </span>
                )}
            </button>

            <button 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all shadow-sm ${currentTab === 'wallet' ? 'bg-dark text-white' : 'bg-white border border-[#EBE3D5] text-dark hover:bg-card'}`}
              onClick={() => setCurrentTab('wallet')}
            >
                Ví: <span className="text-[#E87A3E]">{(walletBalance / 1000).toLocaleString()}k</span>
            </button>
        </div>
      </header>

      {/* THÔNG BÁO TOAST */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full shadow-2xl z-50 font-medium bg-dark text-cream animate-bounce text-center min-w-[300px]">
          {notification}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* TAB SẢN PHẨM */}
        {currentTab === 'home' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-12 border-b border-[#EBE3D5] pb-6">
                <h2 style={{ fontFamily: '"Playfair Display", serif' }} className="text-4xl text-dark italic">Collection 2026</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <div key={product.id} className="group relative">
                  <div className="bg-card rounded-[2.5rem] aspect-[4/5] flex items-center justify-center mb-5 overflow-hidden relative shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-8xl group-hover:scale-110 transition-transform duration-700">👕</div>
                    )}
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="absolute bottom-6 bg-white/90 text-dark px-8 py-3 rounded-full font-bold text-sm shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-accent hover:text-white transition-all duration-300 disabled:opacity-50"
                    >
                      {product.stock === 0 ? 'Hết hàng' : '+ Thêm vào giỏ'}
                    </button>
                  </div>
                  <h3 style={{ fontFamily: '"Playfair Display", serif' }} className="text-xl font-medium text-dark truncate px-2">{product.name}</h3>
                  <div className="flex justify-between items-center mt-2 px-2">
                    <p className="text-muted font-light">{(product.price / 1000).toLocaleString()}k đ</p>
                    <span className="text-[10px] bg-[#EAF0E6] text-[#4A633F] px-3 py-1 rounded-full font-bold tracking-tighter">KHO: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB GIỎ HÀNG */}
        {currentTab === 'cart' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
             <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setCurrentTab('home')} className="text-muted hover:text-dark">← Tiếp tục mua sắm</button>
                <h2 style={{ fontFamily: '"Playfair Display", serif' }} className="text-4xl text-dark">Giỏ hàng của bạn</h2>
             </div>

             {cart.length === 0 ? (
               <div className="bg-card rounded-[3rem] py-20 text-center border-2 border-dashed border-[#EBE3D5]">
                 <p className="text-muted text-lg italic">"Chiếc giỏ này đang chờ những bộ cánh mới..."</p>
                 <button onClick={() => setCurrentTab('home')} className="mt-6 bg-dark text-white px-8 py-3 rounded-full hover:bg-accent transition">Đi shopping ngay!</button>
               </div>
             ) : (
               <div className="space-y-8">
                 <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-[#F4EFE6]">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-6 py-6 border-b border-[#F4EFE6] last:border-0">
                        <div className="w-24 h-28 bg-card rounded-3xl flex items-center justify-center text-4xl shadow-inner">👕</div>
                        <div className="flex-1">
                          <h3 style={{ fontFamily: '"Playfair Display", serif' }} className="text-xl font-medium">{item.name}</h3>
                          <p className="text-muted mt-1">Đơn giá: {(item.price / 1000).toLocaleString()}k đ</p>
                          
                          {/* ĐÃ CẬP NHẬT GIAO DIỆN NÚT CỘNG TRỪ Ở ĐÂY */}
                          <div className="flex items-center gap-5 mt-4">
                             <div className="flex items-center bg-[#FDFBF7] rounded-full p-1 shadow-sm border border-[#EBE3D5]">
                               <button 
                                 onClick={() => decreaseQuantity(item.id)} 
                                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EBE3D5] text-dark transition font-medium"
                               >
                                 -
                               </button>
                               <span className="text-sm font-bold w-8 text-center text-accent">{item.quantity}</span>
                               <button 
                                 onClick={() => increaseQuantity(item.id)} 
                                 disabled={item.quantity >= item.stock}
                                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EBE3D5] text-dark transition font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                               >
                                 +
                               </button>
                             </div>
                             <button 
                               onClick={() => removeFromCart(item.id)} 
                               className="text-red-400 text-sm hover:text-red-600 hover:underline font-medium"
                             >
                               Xóa bỏ
                             </button>
                          </div>
                          
                        </div>
                        <p className="text-xl font-serif font-bold text-dark">{(item.price * item.quantity / 1000).toLocaleString()}k đ</p>
                      </div>
                    ))}
                 </div>
                
                <div className="bg-card rounded-[3rem] p-10 flex flex-col items-end shadow-inner">
                  <div className="flex justify-between w-full mb-4 text-muted border-b border-[#EBE3D5] pb-4">
                    <span>Tạm tính</span>
                    <span>{(totalCartValue / 1000).toLocaleString()}k đ</span>
                  </div>
                  <div className="flex justify-between w-full text-3xl font-serif font-bold text-dark mb-10">
                    <span>Tổng tiền</span>
                    <span className="text-accent">{(totalCartValue / 1000).toLocaleString()}k đ</span>
                  </div>

                  <button 
                    className="w-full bg-dark hover:bg-accent text-white font-bold py-5 rounded-full text-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Tiến hành thanh toán →'}
                  </button>
                </div>
               </div>
             )}
          </div>
        )}

        {/* TAB VÍ TIỀN */}
        {currentTab === 'wallet' && (
          <div className="max-w-md mx-auto animate-fade-in mt-10">
             <div className="flex items-center justify-center gap-4 mb-8">
                <h2 style={{ fontFamily: '"Playfair Display", serif' }} className="text-4xl text-dark text-center">Serein Pay</h2>
             </div>

             <div className="bg-dark p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-xl"></div>
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/20 rounded-full blur-xl"></div>

                <div className="relative z-10 flex justify-between items-start mb-10">
                   <div className="text-left">
                     <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Chủ thẻ</p>
                     <p className="text-white font-serif text-xl">TRUNG BUI</p>
                   </div>
                   <div className="text-right">
                     <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">ID</p>
                     <p className="text-white font-mono tracking-widest">{USER_ID}</p>
                   </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md py-12 rounded-[2rem] shadow-inner border border-white/20 relative z-10">
                  <p className="text-white/70 text-sm mb-3 uppercase tracking-widest font-bold">Số dư hiện tại</p>
                  <p style={{ fontFamily: '"Playfair Display", serif' }} className="text-6xl text-white">
                    {(walletBalance / 1000).toLocaleString()}<span className="text-3xl text-accent">k</span>
                  </p>
                </div>
             </div>

             <div className="mt-8 text-center bg-card py-6 px-8 rounded-3xl border border-[#EBE3D5]">
               <p className="text-sm text-dark font-medium mb-2">💡 Hết tiền để test?</p>
               <p className="text-xs text-muted leading-relaxed">
                 Mở Postman, tạo lệnh <b>POST</b> tới <code className="bg-white px-2 py-1 rounded text-accent">https://soa-paymentservice.onrender.com/api/payments/wallets/topup</code><br/>
                 với body: <code className="bg-white px-2 py-1 rounded text-accent">{`{"userId": "123", "amount": 500000}`}</code> để nạp 500k nhé!
               </p>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;