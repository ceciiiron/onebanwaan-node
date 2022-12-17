import { create, findAll, findOne, update, destroy } from "../controllers/barangayFeedbackController.js";
import express from "express";
const router = express.Router();

export default (app) => {
	router.get("/:barangay_id/feedback", findOne);
	router.put("/:barangay_id/feedback/:barangay_feedback_id", update);
	router.delete("/:barangay_id/feedback/:barangay_feedback_id", destroy);
	router.post("/:barangay_id/feedback", create);

	router.get("/:barangay_id/feedbacks/", findAll);

	app.use("/api/barangays", router);
};
