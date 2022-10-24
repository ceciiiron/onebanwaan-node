import db from "../../models/index.js";
import dayjs from "dayjs";
const ResidentAccount = db.sequelize.models.ResidentAccount;
const BarangayRole = db.sequelize.models.BarangayRole;
const BarangayPermission = db.sequelize.models.BarangayPermission;
const Barangay = db.sequelize.models.Barangay;

import bcrypt from "bcryptjs";

export function login(req, res) {
	// Comment
	ResidentAccount.findOne({
		where: { email: req.body.email },
		include: {
			model: BarangayRole,
			attributes: ["barangay_role_id", "name", "barangay_id"],
			required: true,
			as: "role",
			include: [
				{
					model: BarangayPermission,
					through: { attributes: [] },
					as: "barangay_role_permissions",
				},
				{
					model: Barangay,
					as: "barangay",
				},
			],
		},
	})
		.then((residentAccount) => {
			if (!residentAccount || !bcrypt.compareSync(req.body.password, residentAccount.password)) {
				//check email
				console.log("PASSWORD");
				return res.status(400).send({ errors: [{ msg: "Incorrect username or password", param: "app" }] });
			}
			residentAccount = residentAccount.toJSON();
			console.log(residentAccount);
			delete residentAccount.password;

			req.session.user = residentAccount;

			residentAccount.role.barangay_role_permissions = residentAccount.role.barangay_role_permissions.map((obj) => obj.name);
			console.log("CURRENT SESSION 😁😁😁");
			console.log(req.session.user);
			res.status(200).send(req.session.user);
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
	let resident = await ResidentAccount.findOne({
		where: { resident_account_id: req.session.user.resident_account_id },
		include: {
			model: BarangayRole,
			attributes: ["barangay_role_id", "name"],
			required: true,
			as: "role",
			include: {
				model: BarangayPermission,
				through: { attributes: [] },
				as: "barangay_role_permissions",
			},
		},
	});
	resident = resident?.toJSON();
	resident.role.barangay_role_permissions = resident.role.barangay_role_permissions.map((obj) => obj.name);
	res.status(200).send(resident);
}
