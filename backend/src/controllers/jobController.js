const jobService = require("../services/jobService");
const ApiResponse = require("../utils/apiResponse");

class JobController {
  async createJob(req, res, next) {
    try {
      const job = await jobService.createJob(req.user._id, req.body);
      res.status(201).json(new ApiResponse(201, job, "Job published successfully"));
    } catch (error) {
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const job = await jobService.updateJob(req.user._id, req.params.jobId, req.body);
      res.status(200).json(new ApiResponse(200, job, "Job updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  async listMyJobs(req, res, next) {
    try {
      const jobs = await jobService.listMyJobs(req.user._id);
      res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched"));
    } catch (error) {
      next(error);
    }
  }

  async getJob(req, res, next) {
    try {
      const job = await jobService.getJob(req.user._id, req.params.jobId);
      res.status(200).json(new ApiResponse(200, job, "Job fetched"));
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const { status } = req.body;
      const job = await jobService.updateJobStatus(
        req.user._id,
        req.params.jobId,
        status
      );
      res.status(200).json(new ApiResponse(200, job, "Job status updated"));
    } catch (error) {
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const data = await jobService.deleteJob(req.user._id, req.params.jobId);
      res.status(200).json(new ApiResponse(200, data, "Job deleted"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();