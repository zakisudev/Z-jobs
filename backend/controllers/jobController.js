const Job = require('../models/jobModels');
const asyncHandler = require('express-async-handler');

// @desc    Fetch all jobs
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new job
// @route   POST /api/jobs
// @access  Private
const addJob = asyncHandler(async (req, res) => {
  const { company, website, region, position, salary, contact, status } =
    req.body;
  const user = req.user._id;

  const job = new Job({
    user,
    company,
    website,
    region,
    position,
    salary,
    contact,
    status,
  });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get a single job
// @route   GET /api/jobs/:id
// @access  Private
const getJob = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = asyncHandler(async (req, res) => {
  const { company, website, region, position, salary, contact, status } =
    req.body;

  try {
    const job = await Job.findOne({ user: req.user._id, _id: req.params.id });

    if (job) {
      job.company = company;
      job.website = website;
      job.region = region;
      job.position = position;
      job.salary = salary;
      job.contact = contact;
      job.status = status;

      const updatedJob = await job.save();
      res.json(updatedJob);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      user: req.user._id,
      _id: req.params.id,
    });
    if (job) {
      res.status(200).json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getJobs,
  addJob,
  deleteJob,
  updateJob,
  getJob,
};
