import db from "../../models/index.js";
import dayjs from "dayjs";
const Admin = db.sequelize.models.Admin;

import bcrypt from "bcryptjs";

export function login(req, res) {
	Admin.findOne({
		where: { email: req.body.email },
	})
		.then((admin) => {
			if (!admin || !bcrypt.compareSync(req.body.password, admin.password)) {
				//check email
				console.log("PASSWORD");
				return res.status(400).send({ errors: [{ msg: "Incorrect username or password", param: "app" }] });
			}

			const data = {
				admin_id: admin.dataValues.admin_id,
				first_name: admin.dataValues.first_name,
				middle_initial: admin.dataValues.middle_initial,
				last_name: admin.dataValues.last_name,
				suffix: admin.dataValues.suffix,
				profile_image_link: admin.dataValues.profile_image_link,
				email: admin.dataValues.email,
				role: admin.dataValues.role,
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

export function getSession(req, res) {
	// console.log(req.session.user);
	res.status(200).send({ message: req.session });
}

export async function getAccountFromSession(req, res) {
	const admin = await Admin.findByPk(req.session.user.admin_id, {
		attributes: [
			"admin_id",
			"first_name",
			"middle_initial",
			"last_name",
			"suffix",
			"role",
			"email",
			"contact_number",
			"profile_image_link",
			"resident_account_id",
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
		],
	});
	res.status(200).send({ admin: admin });
}
