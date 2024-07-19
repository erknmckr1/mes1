const express = require('express');
const router = express.Router();
const { getLeaveReasons, createNewLeave,getRecordsById } = require('../services/leaveServices');

//! İzin sebeplerini dönen endpoint
router.get('/getLeaveReasons', async (req, res) => {
  try {
    const result = await getLeaveReasons();
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Invalid req error.' });
  }
});

//! Yeni izin oluşturma endpoint
router.post('/createNewLeave', async (req, res) => {
  const { formData, selectedReason, id_dec, op_username } = req.body;
  const currentDateTimeOffset = new Date().toISOString();
  try {
    if (!formData || !selectedReason || !id_dec || !op_username) {
      return res.status(400).json({ message: 'Gerekli alanlar eksik.' });
    }
    const result = await createNewLeave(formData, selectedReason, id_dec, op_username, currentDateTimeOffset);
    res.status(200).json({ message: 'İzin talebi başarıyla oluşturuldu.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Invalid request error.' });
  }
});

//! kullanının mevcut izinlerini çekecek query
router.post('/getLeaveRecordsById',async(req,res) => {
  
  const {id_dec} = req.body
  try {
    const result = await getRecordsById({id_dec});
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No records found for the given ID." });
    }
  } catch (err) {
    console.error('Error fetching leave records:', err);
    res.status(500).json({ message: "Internal Server Error." });
  }
})

module.exports = router;

