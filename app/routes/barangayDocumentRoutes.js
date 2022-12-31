import { findAll, findAllByBarangay, findOne as findOneSetting, update, findEverything } from "../controllers/barangayDocumentSettingController.js";

import {
	create as createRequest,
	findAllRequestsByBarangay,
	findOne,
	updateDocumentInformation,
	updatePaymentStatus,
	updatePersonalInformation,
	updateRequestStatus,
} from "../controllers/barangayDocumentController.js";
import express from "express";
const router = express.Router();

export default (app) => {
	router.get("/:barangay_id/documentsettings/:barangay_document_setting_id", findOneSetting);
	router.put("/:barangay_id/documentsettings/:barangay_document_setting_id", update);
	// router.delete("/:barangay_id/hotlines/:barangay_hotline_id", destroy);
	router.post("/:barangay_id/requestdocument", createRequest);
	router.get("/:barangay_id/documentrequests", findAllRequestsByBarangay);
	router.get("/:barangay_id/documentrequests/:barangay_document_request_id", findOne);
	router.put("/:barangay_id/documentrequests/:barangay_document_request_id/paymentstatus", updatePaymentStatus);
	router.put("/:barangay_id/documentrequests/:barangay_document_request_id/requeststatus", updateRequestStatus);
	router.put("/:barangay_id/documentrequests/:barangay_document_request_id/personalinformation", updatePersonalInformation);
	router.put("/:barangay_id/documentrequests/:barangay_document_request_id/documentinformation", updateDocumentInformation);
	// router.get("/hotlines/everything", findEverything);
	router.get("/:barangay_id/documentsettings", findAllByBarangay);
	// router.get("/hotlines/", findAll);

	app.use("/api/barangays", router);
};
