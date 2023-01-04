//TODO: ADD VALIDATION
import db from "../models/index.js";

const Admin = db.sequelize.models.Admin;
const Op = db.Sequelize.Op;
import bcrypt from "bcryptjs";
import capitalize from "capitalize";
import FormData from "form-data";
import axios from "axios";

export async function create(req, res) {
	//validate request

	// if (!req.body.name) {
	// 	res.status(400).send({ message: "Name cannot be empty" });
	// 	return;
	// }

	try {
		const adminAccount = {
			first_name: capitalize.words(req.body.first_name),
			middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
			last_name: capitalize.words(req.body.last_name),
			suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
			contact_number: req.body.contact_number?.trim(),
			email: req.body.email,
			role: req.body.role,
			password: bcrypt.hashSync(req.body.password.trim(), 8),
		};

		if (req.file) {
			let form = new FormData();
			form.append("image_file", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});
			form.append("image_type", "admin_profile");
			form.append("directory", "admin_profile");

			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			adminAccount.profile_image_link = message.image_url;
		}

		const admin = await Admin.create(adminAccount);

		delete admin.dataValues.password;

		res.status(201).send({
			admin,
		});
	} catch (error) {
		//TODO: Delete image if it fails
		// await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/new`, { data: {req.file} });

		res.status(500).send({ message: `Could not upload data: ${error}`, stack: error.stack });
	}
}

const getPagination = (page, size) => {
	const limit = size ? +size : 3;
	const offset = page ? page * limit : 0;
	return { limit, offset };
};

const formatPaginatedData = (fetchedData, page, limit) => {
	const { count: totalItems, rows: data } = fetchedData;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);
	return { totalItems, data, totalPages, currentPage, rowPerPage: limit };
};

export const findAllPaginated = (req, res) => {
	const { page = 0, size = 10, search, sortBy = "updated_at", sortOrder = "DESC" } = req.query;
	const { limit, offset } = getPagination(page, size);
	let condition = {
		admin_id: { [Op.ne]: req.session.user.admin_id },
	};

	if (search) {
		let orSearch = {
			[Op.or]: [{ first_name: { [Op.like]: `${search}%` } }, { last_name: { [Op.like]: `${search}%` } }, { email: { [Op.like]: `${search}%` } }],
		};

		Object.assign(condition, orSearch);
	}

	Admin.findAndCountAll({
		where: condition,
		limit,
		offset,

		attributes: [
			"admin_id",
			[
				db.sequelize.fn(
					"CONCAT_WS",
					"|",
					db.sequelize.col("first_name"),
					db.sequelize.col("middle_initial"),
					db.sequelize.col("last_name"),
					db.sequelize.col("suffix")
				),
				"full_name",
			],
			"email",
			"role",
			"profile_image_link",
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
		],
		order: [[sortBy, sortOrder]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export function findAll(req, res) {
	return Admin.findAll({
		where: {
			admin_id: { [Op.ne]: req.session.user.admin_id },
		},
		attributes: ["admin_id", "name", "email", "contact_number", "created_at", "updated_at"],
	})
		.then((data) => {
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({
				message: err.message + err.stack,
			});
		});
}

export function findOne(req, res) {
	const id = req.params.id;

	Admin.findByPk(id, {
		attributes: [
			"admin_id",
			"first_name",
			"middle_initial",
			"last_name",
			"suffix",
			"email",
			"role",
			"contact_number",
			"profile_image_link",
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
		],
	})
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

	try {
		const admin = await Admin.findByPk(id);

		if (!admin) return res.status(404).send({ message: "Data not found" });

		const adminAccount = {
			first_name: capitalize.words(req.body.first_name),
			middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
			last_name: capitalize.words(req.body.last_name),
			suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
			contact_number: req.body.contact_number?.trim(),
			email: req.body.email,
			role: req.body.role,
		};

		if (req.file) {
			let form = new FormData();
			form.append("image_file", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});
			form.append("image_type", "admin_profile");
			form.append("directory", "admin_profile");

			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			//DELETE OLD IMAGE IF OLD LINK IS PRESENT
			if (admin.profile_image_link) {
				const imageUrlsArray = [admin.profile_image_link];
				let params = "?";
				for (let imageUrlIndex in imageUrlsArray) {
					params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
				}

				const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
					headers: { ...form.getHeaders() },
				});
			}

			adminAccount.profile_image_link = message.image_url;
		}

		//update data
		const affectedRow = await Admin.update(adminAccount, {
			where: { admin_id: id },
		});

		res.send({ message: "Data updated successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error updating data", error: error, stack: error.stack });
	}
}

export const destroy = async (req, res) => {
	const id = req.params.id;

	const admin = await Admin.destroy({
		where: { admin_id: id },
	});

	admin == 1 ? res.send({ message: "Data deleted successfully!" }) : res.status(400).send({ message: "Data not found" });
};

export const changePassword = async (req, res) => {
	const admin_id = req.params.admin_id;

	console.log(req.body);

	try {
		const adminAccount = {
			password: bcrypt.hashSync(req.body.password?.trim(), 8),
		};

		const affectedRow = await Admin.update(adminAccount, {
			where: { admin_id },
		});

		res.send({ message: "Password changed successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error changing password", error: error, stack: error.stack });
	}
};

// PROFILE

export const currentChangePassword = async (req, res) => {
	try {
		const adminAccount = {
			password: bcrypt.hashSync(req.body.password?.trim(), 8),
		};

		const affectedRow = await Admin.update(adminAccount, {
			where: { admin_id: req.session.user.admin_id },
		});
		console.log("SESSION");
		console.log(req.session);

		res.send({ message: "Password changed successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error changing password", error: error, stack: error.stack });
	}
};

export async function currentUpdate(req, res) {
	try {
		const admin = await Admin.findByPk(req.session.user.admin_id);

		if (!admin) return res.status(404).send({ message: "Data not found" });

		const adminAccount = {
			first_name: capitalize.words(req.body.first_name),
			middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
			last_name: capitalize.words(req.body.last_name),
			suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
			contact_number: req.body.contact_number?.trim(),
			email: req.body.email,
		};

		if (req.file) {
			let form = new FormData();
			form.append("image_file", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});
			form.append("image_type", "admin_profile");
			form.append("directory", "admin_profile");

			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			//DELETE OLD IMAGE IF OLD LINK IS PRESENT
			if (admin.profile_image_link) {
				const imageUrlsArray = [admin.profile_image_link];
				let params = "?";
				for (let imageUrlIndex in imageUrlsArray) {
					params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
				}
				form.append("image_type", "admin_profile");

				const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
					headers: { ...form.getHeaders() },
				});
			}

			adminAccount.profile_image_link = message.image_url;
		}

		//update data
		const affectedRow = await Admin.update(adminAccount, {
			where: { admin_id: req.session.user.admin_id },
		});

		res.send({ message: "Data updated successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error updating data", error: error, stack: error.stack });
	}
}
