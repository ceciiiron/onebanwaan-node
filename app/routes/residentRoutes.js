import {
	create,
	findAll,
	findOne,
	update,
	destroy,
	currentChangePassword,
	updateAccountStatus,
	changePassword,
	createIndependent,
	checkEmail,
} from "../controllers/residentController.js";
import { isResident } from "../middleware/authResidentSession.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

const upload = multer({
	storage: memoryStorage(),
});

export default (app) => {
	// router.post("/post", upload.single("profile_image_link"), createP);
	router.post("/", create);
	router.post("/registration", upload.array("image_files", 2), createIndependent);

	router.get("/checkemail", checkEmail);
	router.get("/", findAll); //isResident
	//CHANGE PASSWORD
	router.put("/:resident_account_id/current/changepassword", [isResident], currentChangePassword);
	router.put("/:resident_account_id/changepassword", [isResident], changePassword);
	router.put("/:resident_account_id/updatestatus", [isResident], updateAccountStatus);
	router.get("/:resident_account_id", findOne);
	router.put(
		"/:resident_account_id",
		upload.fields([
			{ name: "image_file", maxCount: 1 },
			{ name: "image_cover_file", maxCount: 1 },
		]),
		update
	);

	router.delete("/:id", destroy);

	app.use("/api/residents", router);
};
