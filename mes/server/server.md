- Express.js, Node.js için minimalist ve esnek bir web uygulama çerçevesidir.
- const app = express();
  Bu satır, Express uygulamasını başlatır. app değişkeni, uygulamamızın ana nesnesidir ve üzerinde çeşitli yapılandırmalar yapılabilir.
- const cors = require("cors");
  Bu satır, CORS (Cross-Origin Resource Sharing) modülünü projeye dahil eder. CORS, farklı origin'lerden gelen isteklerin kontrol edilmesine yardımcı olur.
- const cookieParser = require("cookie-parser");
  Bu satır, cookie-parser modülünü projeye dahil eder. Bu modül, gelen HTTP isteklerindeki çerezleri (cookies) ayrıştırır ve kullanıma hazır hale getirir.
- app.use(express.json());
  Bu satır, gelen isteklerin gövdesindeki JSON verilerini ayrıştırmak için express.json() middleware'ini kullanır. Bu, req.body üzerinden JSON verilerine erişim sağlar.
- const corsOptions = { ... };
  Bu blok, CORS ayarlarını yapılandırır. origin, credentials, ve methods gibi seçeneklerle hangi origin'lerden gelen isteklerin kabul edileceğini, hangi HTTP metodlarının izinli olduğunu ve kimlik doğrulama bilgilerinin (çerezler gibi) izin verilip verilmeyeceğini belirler.
- const SECRET_KEY = crypto.randomBytes(32).toString("hex");
  Bu satır, kriptografik olarak güvenli bir rastgele anahtar oluşturur ve onu hexadecimal (onaltılık) bir dizeye dönüştürür. Bu anahtar, JWT oluşturmak ve doğrulamak için kullanılabilir.
