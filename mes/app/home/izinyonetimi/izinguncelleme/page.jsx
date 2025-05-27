"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
// Basit bir debounce fonksiyonu (lodash.debounce da kullanabilirsiniz)
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export default function LeaveUpdatePage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [leaveInputs, setLeaveInputs] = useState({}); // { [userId]: newValue }
  const [isLoading, setIsLoading] = useState(true);
  const { permissions } = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!permissions.includes("BakiyeGüncelleme")) {
      if (permissions.length === 0) return; // henüz yüklenmemiş
      toast.error("Bu sayfaya erişim izniniz yok.");
      router.push("/home");
    }
  }, [permissions]);

  //! get all users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/getAllUsers`
      );
      setUsers(res.data);
      // Arama terimi varsa filtreleyerek, yoksa tüm kullanıcıları göster
      if (search) {
        setFilteredUsers(
          res.data.filter((user) =>
            user.op_username.toLowerCase().includes(search.toLowerCase())
          )
        );
      } else {
        setFilteredUsers(res.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // toast.error("Kullanıcılar yüklenirken bir hata oluştu."); // react-hot-toast ile
      alert("Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Sadece component mount olduğunda çalışır

  // Arama terimi değiştiğinde filtreleme yap
  const applyFilter = (searchValue, currentUsers) => {
    const lowercasedValue = searchValue.toLowerCase();
    const filtered = currentUsers.filter((user) =>
      user.op_username.toLowerCase().includes(lowercasedValue)
    );
    setFilteredUsers(filtered);
  };

  // Debounce edilmiş filtreleme fonksiyonu
  const debouncedFilter = useCallback(
    debounce((value, currentUsers) => {
      applyFilter(value, currentUsers);
      console.log("Filtreleme yapıldı:", value);
    }, 300),
    [users] // users bağımlılığını kaldırdık, fetchUsers sonrası güncellenecek
  );

  // Arama çubuğuna her yazıldığında filtreleme yap
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedFilter(value, users); // Filtrelemeyi her zaman ana 'users' listesi üzerinden yap
  };

  // Kullanıcıdan izin miktarını alacak input'un değerini güncelle
  const handleLeaveChange = (userId, value) => {
    setLeaveInputs((prevInputs) => ({
      ...prevInputs,
      [userId]: value,
    }));
  };

  //! Update leave function
  const handleUpdateLeave = async () => {
    try {
      setIsLoading(true);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/updateLeaveBalance`,
        { leaveInputs },
        { withCredentials: true } // Çerezleri kullanmak için
      );

      if (response.status === 200) {
        toast.success("İzin güncellemeleri başarıyla kaydedildi.");
      }
      setLeaveInputs({}); // Form sıfırla
      fetchUsers(); // Güncel veriyi yeniden çek
    } catch (error) {
      console.error("Toplu güncelleme hatası:", error);
      toast.error("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && users.length === 0) {
    // Sadece ilk yüklemede tam sayfa yükleme göstergesi
    return (
      <div className="w-full h-full flex justify-center items-center text-white text-2xl">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#121212] text-white">
      {/* <Toaster position="top-right" /> */} {/* react-hot-toast için */}
      <div className="w-full h-full p-4 flex flex-col gap-y-5 items-center">
        <h1 className="text-4xl font-bold tracking-tight border-b-2 border-yellow-400 pb-2">
          Kalan İzin Güncelleme Ekranı
        </h1>

        <div className="w-1/2  flex justify-center items-center">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Kullanıcı ara..."
            className="w-full md:w-1/3 px-4 py-3 rounded-lg bg-[#1C1C1C] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <button
            onClick={handleUpdateLeave}
            disabled={Object.keys(leaveInputs).length === 0}
            className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Değişiklikleri Kaydet
          </button>
        </div>

        {isLoading &&
          users.length > 0 && ( // Arama veya güncelleme sonrası yükleme
            <div className="text-yellow-400">
              Kullanıcı listesi güncelleniyor...
            </div>
          )}

        <div
          className="grid gap-4 w-full md:w-2/3 lg:w-1/2 mx-auto overflow-y-auto pr-2"
          style={{
            maxHeight:
              "calc(100vh - 200px)" /* Örnek yükseklik, başlık ve arama çubuğuna göre ayarlayın */,
          }}
        >
          {filteredUsers.length > 0
            ? filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#1A1A1A] border border-gray-700 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-yellow-500"
                >
                  <div className="flex-grow">
                    <p className="text-xl font-semibold text-yellow-300">
                      {user.op_username}
                    </p>
                    <p className="text-sm text-gray-400">
                      Mevcut İzin: {user.izin_bakiye ?? "0"} gün
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="number"
                      value={leaveInputs[user.id_dec.toString()] || ""}
                      onChange={(e) =>
                        handleLeaveChange(
                          user.id_dec.toString(),
                          e.target.value
                        )
                      }
                      placeholder="Yeni İzin"
                      min="0"
                      className="px-3 py-2 w-full sm:w-28 rounded-lg bg-[#2A2A2A] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              ))
            : !isLoading && (
                <p className="text-gray-400 text-center col-span-full">
                  Kullanıcı bulunamadı.
                </p>
              )}
        </div>
      </div>
    </div>
  );
}
