const db = require("../models");
const admins = db.admins;
const Op = db.Sequelize.Op;

const bcrypt = require("bcryptjs");

exports.create = async (req, res) => {
	//validate request

	if (!req.body.name) {
		res.status(400).send({ message: "Name cannot be empty" });
		return;
	}

	const admin = await admins.create({
		name: req.body.name,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password, 8),
		contact_number: req.body.contact_number,
	});

	delete admin.dataValues.password;

	res.send(admin);
};

//get all admin
exports.findAll = (req, res) => {
	return admins
		.findAll()
		.then((data) => {
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({
				message: err.message || "An error occured while retrieving data",
			});
		});
};

exports.findOne = (req, res) => {
	const id = req.params.id;

	admins
		.findByPk(id)
		.then((data) => {
			data ? res.send(data) : res.status(404).send({ message: `Cannot find admin with id = ${id}` });
		})
		.catch((err) => {
			res.status(500).send({ message: "An error occured while retrieving data" });
		});
};

exports.update = async (req, res) => {
	const id = req.params.id;

	const admin = await admins.update(req.body, {
		where: { admin_id: id },
	});

	admin == 1 ? res.send({ message: "Data updated successfully!" }) : res.status(400).send({ message: "Data not found" });
};

exports.delete = async (req, res) => {
	const id = req.params.id;

	const admin = await admins.destroy({
		where: { admin_id: id },
	});

	admin == 1 ? res.send({ message: "Data deleted successfully!" }) : res.status(400).send({ message: "Data not found" });
};
