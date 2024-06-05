const { createBreakReason } = require('../api/breakOperations'); // Doğru yoldan içe aktarın

const breakReason = {
  break_reason_id:'000002',
  break_reason: "Özel Ara",
  
};

createBreakReason(breakReason)
  .then(newBreakReason => console.log('Break reason created successfully or already exists:', newBreakReason))
  .catch(error => console.error('Error creating break reason:', error));
