import db from "../../models/index.js";
import dayjs from "dayjs";
const Admin = db.sequelize.models.Admin;

// import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export function login(req, res) {
	Admin.findOne({
		where: { email: req.body.email },
	})
		.then((admin) => {
			if (!admin || !bcrypt.compareSync(req.body.password, admin.password)) {
				//check email
				console.log("PASSWORD");
				console.log(req.body);
				return res.status(400).send({ errors: [{ msg: "Incorrect username or password", param: "app" }] });
			}

			const data = {
				name: admin.dataValues.name,
				email: admin.dataValues.email,
				admin_id: admin.dataValues.admin_id,
				isLoggedIn: true,
				loginTime: dayjs().format("ddd, MMM D, YYYY h:mm A"),
			};

			req.session.user = data;

			res.status(200).send(data);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message });
		});
}

export function logout(req, res) {
	req.session.destroy((err) => {
		if (err) console.log(`Error destroying session: ${err}`);
		res.status(200).send({ message: "Logged out successfully" });
	});
}

export function checkSession(req, res) {
	console.log(req.session.user);
	res.status(200).send({ message: req.session });
}