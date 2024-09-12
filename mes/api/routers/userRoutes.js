const express = require('express');
const router = express.Router();
const {getAllUsers,getUserWithId} = require("../services/userServices");
const User  = require("../../models/User");
const Permissions = require("../../models/Permissions");
const Role = require("../../models/Roles");


//! Tüm kullanıcıları cekecek route
router.get('/getAllUsers',async (req,res)=>{
    const result = await getAllUsers();
    return res.status(result.status).json(result.message);
});

//! Kullanıcı izinlerini alacak route
router.get('/:userId/permissions', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findByPk(userId, {
            include: {
                model: Role,
                include: {
                    model: Permissions,
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: "Kullanıcı bulunamadı." });
        }

        const permissions = user.Role.Permissions.map(permission => permission.name);
        return res.status(200).json(permissions);
    } catch (error) {
        console.error('Kullanıcı izinleri alınırken hata oluştu:', error);
        res.status(500).json({ message: 'İç sunucu hatası.' });
    }
});

//! İd ye göre kullanıcı olusturacak route
router.get('/:userId/getuserinfo',async(req,res)=> {
    const {userId} = req.params;
    console.log(userId)
    const result = await getUserWithId(userId);
    return res.status(result.status).json(result.message);
});

module.exports = router;