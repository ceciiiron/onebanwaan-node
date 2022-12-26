import { findAll, findAllByBarangay, findOne, update, findEverything } from "../controllers/barangayDocumentSettingController.js";

import { create as createRequest, findAllRequestsByBarangay } from "../controllers/barangayDocumentController.js";
import express from "express";
const router = express.Router();

export default (app) => {
	router.get("/:barangay_id/documentsettings/:barangay_document_setting_id", findOne);
	router.put("/:barangay_id/documentsettings/:barangay_document_setting_id", update);
	// router.delete("/:barangay_id/hotlines/:barangay_hotline_id", destroy);
	router.post("/:barangay_id/requestdocument", createRequest);
	router.get("/:barangay_id/documentrequests", findAllRequestsByBarangay);

	// router.get("/hotlines/everything", findEverything);
	router.get("/:barangay_id/documentsettings", findAllByBarangay);
	// router.get("/hotlines/", findAll);

	app.use("/api/barangays", router);
};
