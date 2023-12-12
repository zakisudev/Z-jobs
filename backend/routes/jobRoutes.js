const express = require('express');
const {
  getJobs,
  getJob,
  addJob,
  deleteJob,
  updateJob,
} = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getJobs).post(protect, addJob);
router
  .route('/:id')
  .get(protect, getJob)
  .delete(protect, deleteJob)
  .put(protect, updateJob);

module.exports = router;
