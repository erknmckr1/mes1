const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
function authorize(requiredPermission) {
  return (req, res, next) => {

    try {
      const token =
        req.cookies.token || req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Token eksik" });

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;

      console.log(decoded)
      // Role veya permission kontrolü burada
      if (
        !decoded.permissions ||
        !decoded.permissions.includes(requiredPermission)
      ) {
        return res.status(403).json({ message: "Yetkisiz erişim" });
      }

      next();
    } catch (err) {
      console.log(err);
      return res.status(403).json({ message: "Geçersiz token" });
    }
  };
}

module.exports = { authorize };
