const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mes', 'root', '496785cA', {
  host: '192.168.1.10',
  dialect: 'mysql',
  pool: {
    max: 5, // Aynı anda en fazla 5 bağlantı olabilir.
    min: 0, // Bağlantı sayısı ihtiyaç olmadığında 0'a kadar düşebilir.
    acquire: 60000, // Bir bağlantının kullanılabilir hale gelmesi için en fazla 30 saniye beklenir.
    idle: 10000 // 10 saniye kullanılmayan bağlantı kapatılır.
  }
});

module.exports = sequelize;
