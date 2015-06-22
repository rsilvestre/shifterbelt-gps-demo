var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Shifterbelt Realtime GPS Tracking Demo' });
});

module.exports = router;
