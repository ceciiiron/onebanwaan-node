import { create, findAll, findAllPaginated, findOne, update, destroy } from "../controllers/barangayController.js";
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
	router.post("/", upload.single("image_file"), create);
	router.get("/", findAll);
	router.get("/:id", findOne);
	router.put("/:id", upload.single("image_file"), update);
	router.delete("/:id", destroy);

	app.use("/api/barangays", router);
};
