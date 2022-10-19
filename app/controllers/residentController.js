import db from "../models/index.js";
import dayjs from "dayjs";
import capitalize from "capitalize";
import bcrypt from "bcryptjs";

const Barangay = db.sequelize.models.Barangay;
const BarangayRole = db.sequelize.models.BarangayRole;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const ResidentDetail = db.sequelize.models.ResidentDetail;
const Op = db.Sequelize.Op;

import fs from "fs";

export const create = async (req, res) => {
	try {
		const residentAccount = {
			professional_title: capitalize.words(req.body.professional_title?.trim() ?? "", true) || null,
			first_name: capitalize.words(req.body.first_name),
			middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
			last_name: capitalize.words(req.body.last_name),
			suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
			email: req.body.email?.trim(),
			passsword: bcrypt.hashSync(req.body.password.trim(), 8),
			privacy: req.body.privacy,
			barangay_role_id: req.body.barangay_role_id,
			bio: req.body.bio?.trim() ?? null,
		};

		const residentDetails = {
			sex: req.body.sex,
			birthdate: req.body.birthdate,
			age: req.body.age,
			home_address: req.body.home_address,
			contact_number: req.body.contact_number,
			occupation: req.body.occupation,
		};

		//upload image first to get url
		if (req.file) {
			let form = new FormData();
			form.append("profile_image_link", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});
			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/resident/profile/new`, form, {
				headers: { ...form.getHeaders() },
			});

			residentAccount.profile_image_link = message.image_url;
		}

		const newResident = await ResidentAccount.create(residentAccount);
		residentDetails.resident_account_id = newResident.dataValues.resident_id;

		//unset hashed password
		delete newResident.dataValues.password;

		res.status(201).send({
			message: {
				resident_account: { ...newResident.dataValues },
			},
		});
	} catch (error) {
		res.status(500).send({ message: `Could not upload data: ${error}`, stack: error.stack });
	}
};

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

export const findAll = (req, res) => {
	let { page = 0, size = 10, search, sortBy = "updated_at", sortOrder = "DESC", barangay_id, barangay_role_id, status } = req.query;
	const { limit, offset } = getPagination(page, size);
	let residentAccountCondition = {};
	let barangayRoleCondition = {};
	let barangayCondition = {};

	if (barangay_id && barangay_id != "ALL") {
		const searchBarangayCondition = {
			barangay_id: barangay_id,
		};
		Object.assign(barangayCondition, searchBarangayCondition);
	}

	if (search) {
		const searchCondition = {
			[Op.or]: [{ first_name: { [Op.like]: `${search}%` } }, { last_name: { [Op.like]: `${search}%` } }, { email: { [Op.like]: `${search}%` } }],
		};
		Object.assign(residentAccountCondition, searchCondition);
	}

	if (status && status != "ALL") {
		const statusCondition = {
			status: status,
		};
		Object.assign(residentAccountCondition, statusCondition);
	}

	if (barangay_role_id && barangay_role_id != "ALL") {
		const setBarangayRoleCondition = {
			barangay_role_id: barangay_role_id,
		};
		Object.assign(barangayRoleCondition, setBarangayRoleCondition);
	}

	ResidentAccount.findAndCountAll({
		where: residentAccountCondition,
		limit,
		offset,
		attributes: [
			"resident_account_id",
			"profile_image_link",
			"status",
			[
				db.sequelize.fn(
					"CONCAT_WS",
					"|",
					db.sequelize.col("professional_title"),
					db.sequelize.col("first_name"),
					db.sequelize.col("middle_initial"),
					db.sequelize.col("last_name"),
					db.sequelize.col("suffix")
				),
				"full_name",
			],
			"email",

			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("ResidentAccount.created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("ResidentAccount.updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
		],
		include: [
			{
				model: BarangayRole,
				required: true,
				as: "role",
				attributes: ["barangay_role_id", "name"],
				where: barangayRoleCondition,
				include: [
					{
						model: Barangay,
						required: true,
						as: "barangay",
						attributes: ["barangay_id", "name", "logo", "number"],
						where: barangayCondition,
					},
				],
			},
		],
		order: [[sortBy, sortOrder]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message + err.stack });
		});
};

export const findOne = async (req, res) => {
	console.log("Pumasok sa find one");
	const id = req.params.id;

	try {
		const barangay = await Barangay.findByPk(id);

		return barangay ? res.send(barangay) : res.status(404).send({ message: `Not Found` });
	} catch (error) {
		res.status(500).send({ message: `An error occured while retrieving data: ${error}` });
	}
};

export const update = async (req, res) => {
	const id = req.params.id;

	const barangayLogo = await Barangay.findByPk(id, { attributes: ["logo"] });

	const data = { ...req.body };

	if (req.file) {
		data.logo = __base_dir + "/resources/static/assets/uploads/" + req.file.renamedFile;
		fs.unlink(barangayLogo.logo, (error) => {});
	}

	await Barangay.update(data, { where: { barangay_id: id } });

	res.send({ message: "Data updated successfully!" });
};

export const destroy = async (req, res) => {
	const id = req.params.id;

	const barangay = await Barangay.findByPk(id);

	//Check if barangay has existing residents, do not delete if it has existing residents that is not superadmin.

	fs.unlink(barangay.logo, (error) => {
		Barangay.destroy({
			where: { barangay_id: id },
		})
			.then((data) => {
				res.send({ message: "Data deleted successfully!" });
			})
			.catch((err) => {
				res.status(400).send({ message: err });
			});
	});
};
