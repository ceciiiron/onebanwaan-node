import { create, findAllByBarangay, findOne, update, destroy } from "../controllers/barangayOfficialController.js";
import express from "express";
const router = express.Router();

export default (app) => {
	router.get("/:barangay_id/officials/:barangay_official_id", findOne);
	router.put("/:barangay_id/officials/:barangay_official_id", update);
	router.delete("/:barangay_id/officials/:barangay_official_id", destroy);
	router.post("/:barangay_id/officials", create);

	router.get("/:barangay_id/officials", findAllByBarangay);
	// router.get("/officials/", findAll);

	app.use("/api/barangays", router);
};
