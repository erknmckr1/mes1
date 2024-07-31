const express = require('express');
const router = express.Router();
const {getAllUsers} = require("../services/userServices")


//! Tüm kullanıcıları cekecek query...
router.get('/getAllUsers',async (req,res)=>{
    const result = await getAllUsers();
    return res.status(result.status).json(result.message);
})

module.exports = router;