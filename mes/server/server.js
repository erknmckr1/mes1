const express = require("express");
const app = express();
const port = process.env.PORT || 3003;
const cors = require("cors");
const http = require("http"); // HTTP sunucu oluşturacağız
const socketIo = require("socket.io"); // Socket.io entegrasyonu
const cookieParser = require("cookie-parser");
const sequelize = require("../lib/dbConnect");
const { syncModels } = require("../models/syncDBmodels");
const leaveRoutes = require("../api/routers/leaveRoutes");
const userRoutes = require("../api/routers/userRoutes");
const orderRoutes = require("../api/routers/orderRoutes");
const shiftRoutes = require("../api/routers/shiftRoutes");
const leaveServices = require("../api/services/leaveServices");

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://192.168.3.5:3000",
    "http://192.168.3.7:3000",
    "http://localhost:3002",
    "http://192.168.0.76:3000",
    "http://192.168.1.246:3000",
  ], // Burada uygun origin'i belirleyin
  credentials: true, // Credentials (cookies, authorization headers vs.) ile isteklere izin ver
  methods: ["GET", "POST", "PUT", "DELETE"], // İzin verilen HTTP metodları
};

app.use(cors(corsOptions));


// **HTTP Sunucusu ve Socket.io Başlatma**
//* ✅ Burada HTTP sunucusunu (http.createServer(app)) manuel olarak oluşturduk ve Express uygulamasını bu sunucunun içine verdik.
//* ✅ Bunun amacı, WebSocket (socket.io gibi) veya diğer HTTP tabanlı protokolleri kullanmak için HTTP sunucusunu doğrudan kontrol edebilmektir.
//* ✅ Express burada yine çalışıyor, ancak artık varsayılan olarak kendi HTTP sunucusunu başlatmıyor.
const server = http.createServer(app); // HTTP sunucu oluştur

//*🔹 socketIo(server) ile WebSocket sunucusunu başlatıyoruz ve bunu HTTP sunucumuza (server) bağlıyoruz.
const io = socketIo(server, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
  },
});

// **Socket.io Bağlantı Dinleyicisi**
io.on("connection", (socket) => {
  console.log("Yeni bir kullanıcı bağlandı:", socket.id);

  // Kullanıcı izinleri güncelleme isteği dinleniyor
  socket.on("refreshLeaves", () => {
    console.log("İzin tablosunun güncellenmesi istendi.");
    io.emit("updateLeaveTable"); // Tüm istemcilere izin tablosunun güncellenmesi gerektiğini bildir
  });

  // Kullanıcı ayrıldığında
  socket.on("disconnect", () => {
    console.log("Kullanıcı bağlantıyı kesti:", socket.id);
  });
});

//! Sequelize ORM kullanarak bir Microsoft SQL Server veritabanına bağlanma, bağlantıyı doğrulama ve veritabanı modellerini senkronize etme işlemlerini gerçekleştirir.
sequelize
  .authenticate() // veri tabanına baglantının basrılı olup olmadıgıı kontrol edılır basarılı ıse ısleme devam...
  .then(() => {
    console.log("MsSql veritabanına bağlantı başarılı.");
    return syncModels(); // model db senkronizasyonu
  })
  .then(() => {
    console.log("Veritabani ve tablolar senkronize edildi.");
    server.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      leaveServices.setSocket(io);
    });
  })
  .catch((err) => {
    console.error("MySQL veritabanına bağlantı başarısız:", err);
  });

//? Süreçler ile ilgili servisler aşağıda......................................................................
app.use("/api/leave", leaveRoutes);

//? Kullanıcılar ile ilgili servisler
app.use("/api/user", userRoutes);

//? Order ıslemlerı ıle ılgılı rotalar (sipariş olustur iptal güncelle vs. bütün iş birimlerinin servislerini içerebilir.)
app.use("/api/order", orderRoutes);

app.use("/api/shift", shiftRoutes);

module.exports = { io };
