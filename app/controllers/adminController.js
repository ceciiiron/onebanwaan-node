//TODO: ADD VALIDATION
import db from "../models/index.js";

const Admin = db.sequelize.models.Admin;
const Op = db.Sequelize.Op;
import bcrypt from "bcryptjs";

export async function create(req, res) {
	//validate request

	if (!req.body.name) {
		res.status(400).send({ message: "Name cannot be empty" });
		return;
	}

	const admin = await Admin.create({
		name: req.body.name,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password, 8),
		contact_number: req.body.contact_number,
	});

	delete admin.dataValues.password;

	res.send(admin);
}

export function findAll(req, res) {
	return Admin.findAll({ attributes: ["admin_id", "name", "email", "contact_number", "created_at", "updated_at"] })
		.then((data) => {
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({
				message: err.message || "An error occured while retrieving data",
			});
		});
}

export function findOne(req, res) {
	const id = req.params.id;

	Admin.findByPk(id, { attributes: ["admin_id", "name", "email", "contact_number", "created_at", "updated_at"] })
		.then((data) => {
			data ? res.send(data) : res.status(404).send({ message: `Cannot find admin with id = ${id}` });
		})
		.catch((err) => {
			res.status(500).send({
				message: "An error occured while retrieving data",
			});
		});
}

export async function update(req, res) {
	const id = req.params.id;

	const admin = await Admin.update(req.body, {
		where: { admin_id: id },
	});

	admin == 1 ? res.send({ message: "Data updated successfully!" }) : res.status(400).send({ message: "Data not found" });
}

export const destroy = async (req, res) => {
	const id = req.params.id;

	const admin = await Admin.destroy({
		where: { admin_id: id },
	});

	admin == 1 ? res.send({ message: "Data deleted successfully!" }) : res.status(400).send({ message: "Data not found" });
};
