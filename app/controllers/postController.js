import db from "../models/index.js";
import dayjs from "dayjs";
import capitalize from "capitalize";
import bcrypt from "bcryptjs";

const Barangay = db.sequelize.models.Barangay;
const Post = db.sequelize.models.Post;
const Op = db.Sequelize.Op;

import axios from "axios";
import FormData from "form-data";
import { nanoid } from "nanoid";

/* ========================================================================== */
/*                               CREATE POST                                  */
/* ========================================================================== */
export const create = async (req, res) => {
	try {
		const post = {
			resident_account_id: req.session.user.resident_account_id,
			post_type_id: req.body.post_type_id || null,
			barangay_id: req.body_post_type_id || null,
			title: capitalize.words(req.body.title?.trim() ?? "", true) || null,
			content: req.body.content?.trim() || null,
			privacy: req.body.privacy || null,
			as_barangay_admin: req.body.as_barangay_admin || null,
		};

		// if (req.file) {
		// 	let form = new FormData();
		// 	form.append("image_file", req.file.buffer, {
		// 		filename: req.file.originalname.replace(/ /g, ""),
		// 		contentType: req.file.mimetype,
		// 		knownLength: req.file.size,
		// 	});

		// 	form.append("image_type", "barangay_logo");
		// 	form.append("directory", barangay.directory);

		// 	const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
		// 		headers: { ...form.getHeaders() },
		// 	});

		// 	post.logo = message.image_name;
		// }
		/* ========================================================================== */

		const newPost = await Post.create(post);

		res.status(201).send(newPost);
	} catch (error) {
		//TODO: Delete image if it fails

		res.status(500).send({ message: `Could not upload post: ${error}`, stack: error.stack });
	}
};

/* ========================================================================== */
/*                                FIND BARANGAY                               */
/* ========================================================================== */

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
	let condition = {};

	if (search) {
		condition.name = { [Op.like]: `%${search}%` };
	}

	Post.findAndCountAll({
		where: condition,
		limit,
		offset,
		attributes: [
			"post_id",
			"resident_account_id",
			"title",
			"content",
			"as_barangay_admin",
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

export const findAll = (req, res) => {
	const { with_images = 0 } = req.query;

	const attributes = ["barangay_id", "name", "number"];

	if (with_images == 1) {
		attributes.push("logo");
		attributes.push("directory");
	}

	Barangay.findAll({
		attributes,
	})
		.then((data) => {
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export const findOne = async (req, res) => {
	const id = req.params.id;

	//check if no admin_id

	try {
		const barangay = await Barangay.findByPk(id, {
			attributes: [
				"barangay_id",
				"name",
				"logo",
				"number",
				"bio",
				"address",
				"directory",
				[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("barangay.created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
				[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("barangay.updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
				[
					db.sequelize.literal(`(SELECT COUNT(*) FROM barangayhotlines as hotlines WHERE hotlines.barangay_id = barangay.barangay_id)`),
					"numberOfHotlines",
				],
				[
					db.sequelize.literal(
						`(SELECT COUNT(*) FROM barangayroles BR 
							INNER JOIN residentaccounts RA on RA.barangay_role_id = BR.barangay_role_id
							WHERE BR.barangay_id = barangay.barangay_id
							)`
					),
					"numberOfResidents",
				],
			],
			include: [
				// {
				// 	model: BarangayHotline,
				// 	as: "hotlines",
				// 	attributes: [],
				// 	required: true,
				// },
				// {
				// 	model: BarangayRole,
				// 	as: "barangay_roles",
				// 	attributes: [],
				// 	// attributes: [[db.sequelize.fn("COUNT", db.sequelize.col(`resident_accounts.barangay_role_id`)), "numberOfResidents"]],
				// 	required: false,
				// 	include: [{ model: ResidentAccount, as: "resident_accounts", attributes: [], required: true }],
				// },
			],
		});

		return barangay ? res.send(barangay) : res.status(404).send({ message: `Not Found` });
	} catch (error) {
		res.status(500).send({ message: `An error occured while retrieving data: ${error} ${error.stack}` });
	}
};

export const update = async (req, res) => {
	const id = req.params.id;

	const barangay = await Barangay.findByPk(id, { attributes: ["logo"] });

	const data = { ...req.body };

	let testing;

	if (req.file) {
		let form = new FormData();
		form.append("image_file", req.file.buffer, {
			filename: req.file.originalname.replace(/ /g, ""),
			contentType: req.file.mimetype,
			knownLength: req.file.size,
		});
		const { data: msg } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/new`, form, {
			headers: { ...form.getHeaders() },
		});
		testing = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/delete`, { params: { image_file: barangay.logo } });

		data.logo = msg.image_url;
	}

	await Barangay.update(data, { where: { barangay_id: id } });

	res.send({ message: "Data updated successfully!", data: testing?.data });
};

export const destroy = async (req, res) => {
	const id = req.params.id;

	const barangay = await Barangay.findByPk(id);

	//TODO: Check if barangay has existing residents, do not delete if it has existing residents that is not superadmin.

	Barangay.destroy({
		where: { barangay_id: id },
	})
		.then((data) => {
			res.send({ message: "Data deleted successfully!" });
		})
		.catch((err) => {
			res.status(400).send({ message: err });
		});
};
/* ========================================================================== */
/*                                    UTILS                                   */
/* ========================================================================== */
// const findResidentByEmail = async (email) => {
// 	return await ResidentAccount.findOne({ where: { email } });
// };

// const findBarangayByNumber = async (number) => {
// 	return await Barangay.findOne({ where: { number } });
// };
