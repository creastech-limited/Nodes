const express = require('express');
const router = express.Router();
const {emailFeedback} = require('../Controllers/feedback');

router.get('/', emailFeedback);
module.exports = router