import { create, findAll, findAllByBarangay, findOne, update, destroy, findEverything } from "../controllers/barangayHotlineController.js";
import express from "express";
const router = express.Router();

export default (app) => {
	router.get("/:barangay_id/hotlines/:barangay_hotline_id", findOne);
	router.put("/:barangay_id/hotlines/:barangay_hotline_id", update);
	router.delete("/:barangay_id/hotlines/:barangay_hotline_id", destroy);
	router.post("/:barangay_id/hotlines", create);

	router.get("/hotlines/everything", findEverything);
	router.get("/:barangay_id/hotlines", findAllByBarangay);
	router.get("/hotlines/", findAll);

	app.use("/api/barangays", router);
};
