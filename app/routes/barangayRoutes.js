import {
	create,
	findAll,
	findAllPaginated,
	findAllDocumentSettings,
	findOne,
	update,
	destroy,
	updatePublicProfile,
	updateVisionMissionGoals,
	updateLocation,
	pinPost,
	unpinPost,
	updateCitizenCharter,
	findAllAuditLogsByBarangay,
	updateHealthSchedule,
} from "../controllers/barangayController.js";
import express from "express";
const router = express.Router();

import multer, { memoryStorage } from "multer";

import nodemailer from "nodemailer";

// const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const upload = multer({
	storage: memoryStorage(),
});

let transporter = nodemailer.createTransport({
	host: "smtp.hostinger.com",
	port: 465,
	secure: true, // true for 465, false for other ports
	auth: {
		user: "support@onebanwaan.com", // generated ethereal user
		pass: "2019-Cs-100456", // generated ethereal password
	},
});

var mailOptions = {
	sender: "One Banwaan",
	from: "support@onebanwaan.com",
	to: "cecironalejoiii@gmail.com",
	subject: "Test send email",
	text: "That was easy!",
};

export default (app) => {
	router.get("/sendemail", (req, res) => {
		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log("Email sent: " + info.response);
			}
		});

		res.status(200).send({ message: `Done action` });
	});

	router.get("/paginated", findAllPaginated);
	router.get("/documentsettings", findAllDocumentSettings);
	router.post("/", upload.single("image_file"), create);
	router.get("/", findAll);
	router.get("/:barangay_id/auditlogs", findAllAuditLogsByBarangay);
	router.get("/:id", findOne);
	router.put(
		"/:barangay_id/publicprofile",
		upload.fields([
			{ name: "image_file", maxCount: 1 },
			{ name: "image_cover_file", maxCount: 1 },
		]),
		updatePublicProfile
	);
	router.put("/:barangay_id/citizencharter", upload.fields([{ name: "image_file", maxCount: 1 }]), updateCitizenCharter);
	router.put("/:barangay_id/pinpost", pinPost);
	router.put("/:barangay_id/unpinpost", unpinPost);
	router.put("/:barangay_id/visionmissiongoals", updateVisionMissionGoals);
	router.put("/:barangay_id/location", updateLocation);
	router.put("/:barangay_id/healthschedule", updateHealthSchedule);
	router.delete("/:id", destroy);

	app.use("/api/barangays", router);
};
