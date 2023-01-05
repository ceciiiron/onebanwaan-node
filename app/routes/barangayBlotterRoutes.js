import {
	create,
	findAllBlotterByBarangay,
	findAllCaseTypes,
	findOne,
	updateCaseType,
	updateNarrative,
	updateStatus,
} from "../controllers/barangayBlotterController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	router.post("/:barangay_id/blotter", upload.single("image_file"), create);
	router.put("/:barangay_id/blotter/:barangay_blotter_id/status", updateStatus);
	router.put("/:barangay_id/blotter/:barangay_blotter_id/casetype", updateCaseType);
	router.put("/:barangay_id/blotter/:barangay_blotter_id/narrative", updateNarrative);
	router.get("/:barangay_id/blotter", findAllBlotterByBarangay);
	router.get("/:barangay_id/blotter/coveredcases", findAllCaseTypes);
	router.get("/:barangay_id/blotter/:barangay_blotter_id", findOne);
	router.get("/:barangay_id/blotter/:barangay_blotter_id", findOne);

	app.use("/api/barangays", router);
};
