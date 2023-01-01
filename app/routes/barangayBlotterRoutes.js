import { create, findAllBlotterByBarangay } from "../controllers/barangayBlotterController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	// router.put("/:barangay_id/documentsettings/:barangay_document_setting_id", update);
	// router.delete("/:barangay_id/hotlines/:barangay_hotline_id", destroy);
	router.post("/:barangay_id/blotter", upload.single("image_file"), create);
	router.get("/:barangay_id/blotter", findAllBlotterByBarangay);
	// router.get("/:barangay_id/documentrequests/:barangay_document_request_id", findOne);
	// router.put("/:barangay_id/documentrequests/:barangay_document_request_id/paymentstatus", updatePaymentStatus);
	// router.put("/:barangay_id/documentrequests/:barangay_document_request_id/requeststatus", updateRequestStatus);
	// router.put("/:barangay_id/documentrequests/:barangay_document_request_id/personalinformation", updatePersonalInformation);
	// router.put("/:barangay_id/documentrequests/:barangay_document_request_id/documentinformation", updateDocumentInformation);
	// router.get("/hotlines/everything", findEverything);
	// router.get("/:barangay_id/documentsettings", findAllByBarangay);
	// router.get("/hotlines/", findAll);

	app.use("/api/barangays", router);
};
