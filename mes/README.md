This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

# Git İşlemleri

## Son Commit'i Silmek ve Değişiklikleri Korumak

Son commit'i silmek ve değişiklikleri korumak için aşağıdaki komutu kullanabilirsiniz:

```bash
git reset --soft HEAD~1

git push origin main --force

```

# Sequelize

- Sequelize Node js (orm aracı)... crud operasyonlarını basıte ındırır ve ısteklerde sql kodu yazmamızın onune gecer...
  Öncelikle veri tabanına sequelize ile bir bağlantı olusutur

```bash
  const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('db name', 'user name', 'passowrd', {
host: '',
dialect: 'mysql',
pool: {
max: 5, // Aynı anda en fazla 5 bağlantı olabilir.
min: 0, // Bağlantı sayısı ihtiyaç olmadığında 0'a kadar düşebilir.
acquire: 60000, // Bir bağlantının kullanılabilir hale gelmesi için en fazla 30 saniye beklenir.
idle: 10000 // 10 saniye kullanılmayan bağlantı kapatılır.
}
});

module.exports = sequelize;
```


- MUI table componenti ıcın gerekli paketler (gerek duymadıgında kaldır...)
````
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-data-grid
````
