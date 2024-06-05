const {createUser} = require('../api/userOperations/userAuthOperations')

const userData = {
    id_dec: "207927465",
    id_hex: "0C64B8A9",
    op_name: "ercakir",
    op_username: "Erkan Mustafa Cakir",
    is_active: 1,
    is_admin: 0,
    op_password: "ercakir7465",
    op_section: "BilgiIslem",
    part: "BilgiIslem",
    title: "Muhendis",
    auth2: [
      {
        id: "",
      },
      {
        id: "",
      },
    ],
    auth1: [
      {
        id: "1782014233",
      },
      {
        id: "0000001",
      },
    ],
    address: "Fevzi Cakmak Mah. Guven Sok. No:32/9 Bahcelievler/Istanbul",
    e_mail: "ecakir@midas.com.tr",
    shift_validator: "1782014233",
    gender: "Erkek",
    short_name: "Er.Ca.",
    route: "Bahcelievler-Şirinevler-Bakirkoy-Yesilkoy",
    stop_name: "Yenibosna",
    izin_bakiye: 10,
  };
  
  createUser(userData)
    .then(newUser => console.log('User created successfully:', newUser))
    .catch(error => console.error('Error creating user:', error));