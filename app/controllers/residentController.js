import db from "../models/index.js";
// import dayjs from "dayjs";
import capitalize from "capitalize";
import bcrypt from "bcryptjs";

const Barangay = db.sequelize.models.Barangay;
const BarangayRole = db.sequelize.models.BarangayRole;
const ResidentAccount = db.sequelize.models.ResidentAccount;
// const ResidentDetail = db.sequelize.models.ResidentDetail;
const Op = db.Sequelize.Op;

import axios from "axios";
import FormData from "form-data";

import fs from "fs";
import { nanoid } from "nanoid";

export const create = async (req, res) => {
	try {
		const residentAccount = {
			professional_title: capitalize.words(req.body.professional_title?.trim() ?? "", true) || null,
			first_name: capitalize.words(req.body.first_name),
			middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
			last_name: capitalize.words(req.body.last_name),
			suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
			email: req.body.email?.trim(),
			password: bcrypt.hashSync(req.body.password.trim(), 8),
			barangay_role_id: req.body.barangay_role_id,
			directory: nanoid(16),
			// privacy: req.body.privacy,
			// bio: req.body.bio?.trim() ?? null,
		};

		console.log("AAAAA", residentAccount);

		if (await ResidentAccount.findOne({ where: { email: residentAccount.email } })) {
			return res.status(400).send({
				error: {
					msg: "existing_resident_account",
					param: "email",
				},
			});
		}

		const newResident = await ResidentAccount.create(residentAccount);
		delete newResident.dataValues.password;

		res.status(201).send(newResident);
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
			"directory",
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
						attributes: ["barangay_id", "name", "logo", "number", "directory"],
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
	const { resident_account_id } = req.params;

	try {
		const residentAccount = await ResidentAccount.findByPk(resident_account_id, {
			include: {
				model: BarangayRole,
				attributes: ["barangay_role_id", "name"],
				required: true,
				as: "role",
				include: [
					{
						model: Barangay,
						as: "barangay",
					},
				],
			},
		});

		return residentAccount ? res.send(residentAccount) : res.status(404).send({ message: `Not Found` });
	} catch (error) {
		res.status(400).send({ message: `An error occured while retrieving data: ${error}` });
	}
};

export const update = async (req, res) => {
	const { resident_account_id } = req.params;

	const updateResidentAccount = {
		professional_title: capitalize.words(req.body.professional_title?.trim() ?? "", true) || null,
		first_name: capitalize.words(req.body.first_name),
		middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
		last_name: capitalize.words(req.body.last_name),
		suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
		email: req.body.email?.trim(),
		// passsword: bcrypt.hashSync(req.body.password.trim(), 8),
		// privacy: req.body.privacy,
		// barangay_role_id: req.body.barangay_role_id,
		bio: req.body.bio?.trim() ?? null,
	};

	//Check if email exists;
	if (await ResidentAccount.findOne({ where: { email: updateResidentAccount.email, [Op.not]: { resident_account_id: resident_account_id } } })) {
		return res.status(400).send({
			error: {
				msg: "existing_resident_account",
				param: "email",
			},
		});
	}

	const residentAccount = await ResidentAccount.findByPk(resident_account_id, {
		include: {
			model: BarangayRole,
			attributes: ["barangay_role_id", "name"],
			required: true,
			as: "role",
			include: [
				{
					model: Barangay,
					as: "barangay",
				},
			],
		},
	});

	if (req.files["image_file"]?.[0]) {
		let form = new FormData();
		form.append("image_file", req.files["image_file"][0].buffer, {
			filename: req.files["image_file"][0].originalname.replace(/ /g, ""),
			contentType: req.files["image_file"][0].mimetype,
			knownLength: req.files["image_file"][0].size,
		});

		form.append("image_type", "resident_profile");
		form.append("directory", residentAccount.role.barangay.directory);
		form.append("sub_directory", residentAccount.directory);

		const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
			headers: { ...form.getHeaders() },
		});

		//check if coverfile is present on database.
		//delete the old image.
		if (residentAccount.profile_image_link) {
			const imageUrlsArray = [residentAccount.profile_image_link];
			let params = "?";
			for (let imageUrlIndex in imageUrlsArray) {
				params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
			}
			params += "&image_type=resident_profile";
			params += "&directory=" + residentAccount.role.barangay.directory;
			params += "&sub_directory=" + residentAccount.directory;

			const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
				headers: { ...form.getHeaders() },
			});
		}

		updateResidentAccount.profile_image_link = message.image_name;
	}

	if (req.files["image_cover_file"]?.[0]) {
		let form = new FormData();
		form.append("image_cover_file", req.files["image_cover_file"][0].buffer, {
			filename: req.files["image_cover_file"][0].originalname.replace(/ /g, ""),
			contentType: req.files["image_cover_file"][0].mimetype,
			knownLength: req.files["image_cover_file"][0].size,
		});

		form.append("image_type", "resident_cover");
		form.append("directory", residentAccount.role.barangay.directory);
		form.append("sub_directory", residentAccount.directory);

		try {
			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			if (residentAccount.cover_image_link) {
				const imageUrlsArray = [residentAccount.cover_image_link];
				let params = "?";
				for (let imageUrlIndex in imageUrlsArray) {
					params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
				}
				params += "&image_type=resident_cover";
				params += "&directory=" + residentAccount.role.barangay.directory;
				params += "&sub_directory=" + residentAccount.directory;

				const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
					headers: { ...form.getHeaders() },
				});
			}

			updateResidentAccount.cover_image_link = message.image_name;
		} catch (error) {
			console.log("IMAGEERROR", error, error.stack);
		}
	}

	const affectedRow = await ResidentAccount.update(updateResidentAccount, { where: { resident_account_id } });

	res.send({ message: "Data updated successfully!", affectedRow });
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

export const updateAccountStatus = async (req, res) => {
	const resident_account_id = req.params.resident_account_id;

	try {
		const residentAccountStatus = {
			status: req.body.status,
			barangay_role_id: req.body.barangay_role_id,
		};

		const affectedRow = await ResidentAccount.update(residentAccountStatus, {
			where: { resident_account_id },
		});

		res.send({ message: "Account status updated successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error changing password", error: error, stack: error.stack });
	}
};

/* ========================================================================== */
/*                               CHANGE PASSWORD                              */
/* ========================================================================== */

export const changePassword = async (req, res) => {
	const resident_account_id = req.params.resident_account_id;

	try {
		const residentPassword = {
			password: bcrypt.hashSync(req.body.password?.trim(), 8),
		};

		const affectedRow = await ResidentAccount.update(residentPassword, {
			where: { resident_account_id },
		});

		res.send({ message: "Password changed successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error changing password", error: error, stack: error.stack });
	}
};

// LOGGED IN
export const currentChangePassword = async (req, res) => {
	//TODO: Add backend validation
	try {
		const residentPassword = {
			password: bcrypt.hashSync(req.body.password?.trim(), 8),
		};

		const affectedRow = await ResidentAccount.update(residentPassword, {
			where: { resident_account_id: req.session.user.resident_account_id },
		});

		res.send({ message: "Password changed successfully!", affectedRow: affectedRow });
	} catch (error) {
		res.status(500).send({ message: "Error changing password", error: error, stack: error.stack });
	}
};
