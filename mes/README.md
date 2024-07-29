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

```
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-data-grid
```

# Dizi Elemanlarını İndekse Göre Güncelleme

```bash
 const [repairReasons, setRepairReasons] = useState(["", "", "", ""]);

  const updateRepairReason = (index, value) => {
    const selectedReason = repairReasonsList.find(
      (item) => item.repair_reason_id === value
    );
    if (selectedReason) {
      setRepairReasons((prev) => {
        const newReasons = [...prev];
        newReasons[index] = selectedReason.repair_reason;
        return newReasons;
      });
    }
  };



  <div className="w-full h-[300px] mt-1 overflow-y-auto">
    <div className="w-full h-1/2 flex p-1 gap-x-1">
      {repairReasons.map((reason, index) => (
        <Input
          key={index}
          addProps="h-20 text-[30px] text-center font-semibold text-black"
          placeholder={`${index + 1}. Neden`}
          onChange={(e) =>
            updateRepairReason(index, e.target.value)
          }
        />
      ))}
    </div>
    <div className="w-full h-1/2 flex p-1 gap-x-3">
      {repairReasons.map((reason, index) => (
        <span
          key={index}
          className="h-20 w-[135px] text-[25px] text-center font-semibold"
        >
          {index + 1}. {reason}
        </span>
      ))}
    </div>
    <div className="w-full h-1/2 flex p-1 gap-x-3 ">
      {repairReasons.map((item, index) => {
        <span className="h-20 w-[135px] text-[25px] text-center font-semibold">
          {index + 1} {item}
        </span>;
      })}
    </div>
  </div>
```

- Yukarıdaki fonksiiyon 'repairReasons' adlı state de belirli indexteki tamir nedenini günceller.
  - index ve value parametrelerini alır. index güncellenmesi gereken tamir nedeninin sırasını, value ise yeni değeri temsil eder.
  - setRepairReasons fonksiyonunu kullanarak state'i güncelleriz. setRepairReasons içine bir fonksiyon geçiyoruz; bu fonksiyon önceki state'i (prev) alır.
  - prev array'ini newReasons adında bir kopya array'e çeviririz (const newReasons = [...prev];). Bu, doğrudan state'i değiştirmemek için yapılır.
  - newReasons[index] = value; ile belirli indeksteki değeri yeni değerle (value) güncelleriz.
  - Son olarak, güncellenmiş newReasons array'ini döneriz ve bu array state'i günceller.




{
  "scripts": {
    "start": "node server/server.js",
    "dev": "next dev",
    "build": "next build",
    "start:prod": "next start"
  }
}


