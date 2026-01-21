const express = require("express"),
     router = express.Router();
    
router.use('/auth',require('./auth.routes'));
// router.use('/users',require('./user.routes'));
// router.use('/stores',require('./store.routes'));

module.exports = router;