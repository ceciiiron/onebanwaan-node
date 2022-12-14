import db from "../models/index.js";
import dayjs from "dayjs";
import capitalize from "capitalize";
import bcrypt from "bcryptjs";

const Barangay = db.sequelize.models.Barangay;
const BarangayRole = db.sequelize.models.BarangayRole;
const BarangayHotline = db.sequelize.models.BarangayHotline;
const BarangayDocumentSetting = db.sequelize.models.BarangayDocumentSetting;
const DocumentType = db.sequelize.models.DocumentType;
const BarangayOfficial = db.sequelize.models.BarangayOfficial;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const Post = db.sequelize.models.Post;
const AuditLog = db.sequelize.models.AuditLog;
const Op = db.Sequelize.Op;

import axios from "axios";
import FormData from "form-data";
import { nanoid } from "nanoid";

/* ========================================================================== */
/*                               CREATE BARANGAY                              */
/* ========================================================================== */
export const create = async (req, res) => {
	try {
		const barangay = {
			name: capitalize.words(req.body.name),
			number: req.body.number,
			lat: req.body.lat,
			lng: req.body.lng,
			bio: req.body.bio?.trim(),
			address: capitalize.words(req.body.address?.trim() ?? "", true) || null,
			directory: nanoid(16),
		};

		const residentAccount = {
			// professional_title: capitalize.words(req.body.professional_title?.trim() ?? "", true) || null,
			first_name: capitalize.words(req.body.first_name),
			middle_initial: capitalize.words(req.body.middle_initial?.trim() ?? "", true) || null,
			last_name: capitalize.words(req.body.last_name),
			suffix: capitalize.words(req.body.suffix?.trim() ?? "", true) || null,
			email: req.body.email?.trim(),
			password: bcrypt.hashSync(req.body.password.trim(), 8),
			directory: nanoid(16),
			profile_image_link: null,
			cover_image_link: null,
		};

		//Image is required
		//VALIDATION ==================================
		if (!req.file) {
			return res.status(400).send({ error: { msg: "missing_barangay_logo", param: "image_file" } });
		}
		//check for existing barangay number
		if (await Barangay.findOne({ where: { number: barangay.number } })) {
			return res.status(400).send({
				error: {
					msg: "existing_barangay_number",
					param: "number",
				},
			});
		}
		//check for existing resident account
		if (await ResidentAccount.findOne({ where: { email: residentAccount.email } })) {
			return res.status(400).send({
				error: {
					msg: "existing_resident_account",
					param: "email",
				},
			});
		}

		let form = new FormData();
		form.append("image_file", req.file.buffer, {
			filename: req.file.originalname.replace(/ /g, ""),
			contentType: req.file.mimetype,
			knownLength: req.file.size,
		});

		form.append("image_type", "barangay_logo");
		form.append("directory", barangay.directory);

		const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
			headers: { ...form.getHeaders() },
		});

		barangay.logo = message.image_name;

		/* ========================================================================== */

		const newBarangay = await Barangay.create(barangay);

		//after insertion of new barangay, create 2 roles: Superadmin and Resident role
		const newBarangayRoles = await BarangayRole.bulkCreate([
			{ name: "SUPERADMIN", barangay_id: newBarangay.barangay_id },
			{ name: "RESIDENT", barangay_id: newBarangay.barangay_id },
		]);

		const newSuperadminBarangayRole = newBarangayRoles[0];
		const newResidentBarangayRole = newBarangayRoles[1];

		//insert barangay permissions to barangay superadmin role
		const [results, metadata] = await db.sequelize.query(
			'INSERT INTO BarangayRolePermissions(barangay_role_id, barangay_permission_id) SELECT $1 as "barangay_role_id", barangay_permission_id FROM BarangayPermissions',
			{
				bind: [newSuperadminBarangayRole.barangay_role_id], //set superadmin role
			}
		);

		//insert selected barangay permissions for new barangay resident role
		const [rs, md] = await db.sequelize.query(
			`INSERT INTO BarangayRolePermissions(barangay_role_id, barangay_permission_id) 
			SELECT $1 as "barangay_role_id", barangay_permission_id FROM BarangayPermissions WHERE name IN ("create_post")`,
			{
				bind: [newResidentBarangayRole.barangay_role_id], //set resident role
			}
		);

		//create document settings

		const [rs2, md2] = await db.sequelize.query(
			`INSERT INTO BarangayDocumentSettings(barangay_id, document_type_id) 
			SELECT $1 as "barangay_id", document_type_id FROM DocumentTypes`,
			{
				bind: [newBarangay.barangay_id], //set barangay_id
			}
		);

		const newResident = await ResidentAccount.create({
			...residentAccount,
			barangay_role_id: newSuperadminBarangayRole.barangay_role_id,
		});

		delete newResident.dataValues.password;

		/* ========================================================================== */

		res.status(201).send({
			message: {
				barangay: { ...newBarangay.dataValues },
				resident_account: { ...newResident.dataValues, barangay_role: newSuperadminBarangayRole.name },
			},
		});
	} catch (error) {
		//TODO: Delete image if it fails
		// await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/new`, { data: {req.file} });

		res.status(500).send({ message: `Could not upload data: ${error}`, stack: error.stack });
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
	// console.log(req.session.user);

	if (search) {
		condition.name = { [Op.like]: `%${search}%` };
	}

	Barangay.findAndCountAll({
		where: condition,
		limit,
		offset,
		attributes: [
			"barangay_id",
			"name",
			"logo",
			"number",
			"directory",
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

	const attributes = ["barangay_id", "name", "number", "directory"];

	if (with_images == 1) {
		attributes.push("logo");
		attributes.push("cover_image_link");
		attributes.push("directory");
	}

	Barangay.findAll({
		attributes,
		order: [["number", "ASC"]],
	})
		.then((data) => {
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export const findAllDocumentSettings = (req, res) => {
	const attributes = ["barangay_id", "name", "number", "directory"];

	Barangay.findAll({
		attributes,
		order: [["number", "ASC"]],
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				include: [
					{
						model: DocumentType,
						as: "barangay_document_settings",
						// attributes: [],
						// required: true,
					},
				],
			},
		],
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
				"lat",
				"lng",
				"vision",
				"mission",
				"goals",
				"name",
				"logo",
				"cover_image_link",
				"number",
				"bio",
				"pinned_post",
				"citizen_charter",
				"health_schedule",
				"address",
				"directory",
				[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("Barangay.created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
				[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("Barangay.updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
				[
					db.sequelize.literal(`(SELECT COUNT(*) FROM BarangayHotlines as hotlines WHERE hotlines.barangay_id = Barangay.barangay_id)`),
					"numberOfHotlines",
				],
				[
					db.sequelize.literal(
						`(SELECT COUNT(*) FROM BarangayRoles BR 
							INNER JOIN ResidentAccounts RA on RA.barangay_role_id = BR.barangay_role_id
							WHERE BR.barangay_id = Barangay.barangay_id
							)`
					),
					"numberOfResidents",
				],
			],
			include: [
				{
					model: BarangayOfficial,
					as: "officials",
				},
			],
			order: [[{ model: BarangayOfficial, as: "officials" }, "hierarchy", "ASC"]],
		});

		let pinned_post = [];
		if (barangay.pinned_post) {
			console.log("HAS PINNED POST");
			const as_barangay_admin = false;
			const fields = [
				"Posts.*",
				"PT.name as post_type_name",
				"RA.profile_image_link",
				"RA.first_name",
				"RA.middle_initial",
				"RA.last_name",
				"RA.suffix",
				"RA.directory as resident_directory",
				"B.barangay_id as resident_from_barangay_id",
				"B.logo",
				"B.name",
				"B.number",
				"B.directory as barangay_directory",
				"HeartCounter.hearts_count",
				"PI.post_images",
			];

			const bind = { post_id: barangay.pinned_post };

			let isFavoriteQuery = "";
			if (req.session.user?.resident_account_id) {
				fields.push("(IsFavorite.post_heart_id IS NOT NULL) as is_favorite");
				isFavoriteQuery = `LEFT JOIN (SELECT post_id, post_heart_id FROM PostHearts WHERE resident_account_id = $resident_account_id AND as_barangay_admin = $as_barangay_admin ) as IsFavorite ON IsFavorite.post_id = Posts.post_id`;
				Object.assign(bind, {
					resident_account_id: req.session.user.resident_account_id,
					as_barangay_admin: as_barangay_admin,
				});
			}

			const [results, metadata] = await db.sequelize.query(
				`SELECT ${fields.join(",")}
			FROM Posts 
			INNER JOIN ResidentAccounts RA ON RA.resident_account_id = Posts.resident_account_id
			INNER JOIN BarangayRoles BR ON BR.barangay_role_id = RA.barangay_role_id
			INNER JOIN Barangays B ON B.barangay_id = BR.barangay_id
			LEFT JOIN PostTypes PT ON PT.post_type_id = Posts.post_type_id
			LEFT JOIN (SELECT GROUP_CONCAT(image_link SEPARATOR "|") as post_images, post_id FROM PostImages GROUP BY post_id ORDER BY post_image_id ASC) as PI ON PI.post_id = Posts.post_id
			LEFT JOIN (SELECT COUNT(*) as hearts_count, post_id FROM PostHearts GROUP BY post_id) as HeartCounter ON HeartCounter.post_id = Posts.post_id
			${isFavoriteQuery}
			WHERE Posts.post_id = $post_id`,
				{
					bind: bind,
				}
			);

			pinned_post = results;
		}

		return barangay ? res.status(200).send({ barangay, pinned_post }) : res.status(404).send({ message: `Not Found` });
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

	//Delete DIR

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
/*                              BARANGAY ACCOUNT                              */
/* ========================================================================== */

export const pinPost = async (req, res) => {
	const { barangay_id } = req.params;

	const updateBarangay = {
		pinned_post: req.body.post_id,
	};

	const selectedPost = await Post.findByPk(req.body.post_id);

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY PROFILE",
		action: "UPDATE",
		description: `Pinned Post ${selectedPost.title}`,
	});

	res.send({ message: "Data updated successfully!", affectedRow });
};

export const unpinPost = async (req, res) => {
	const { barangay_id } = req.params;

	const updateBarangay = {
		pinned_post: null,
	};

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY PROFILE",
		action: "UPDATE",
		description: `Unpinned Post`,
	});

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	res.send({ message: "Data updated successfully!", affectedRow });
};

export const updatePublicProfile = async (req, res) => {
	const { barangay_id } = req.params;

	const updateBarangay = {
		bio: req.body.bio?.trim() ?? null,
	};

	const barangay = await Barangay.findByPk(barangay_id);

	if (req.files["image_file"]?.[0]) {
		let form = new FormData();
		form.append("image_file", req.files["image_file"][0].buffer, {
			filename: req.files["image_file"][0].originalname.replace(/ /g, ""),
			contentType: req.files["image_file"][0].mimetype,
			knownLength: req.files["image_file"][0].size,
		});

		form.append("image_type", "barangay_logo");
		form.append("directory", barangay.directory);

		const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
			headers: { ...form.getHeaders() },
		});

		//check if coverfile is present on database.
		//delete the old image.
		if (barangay.logo) {
			const imageUrlsArray = [barangay.logo];
			let params = "?";
			for (let imageUrlIndex in imageUrlsArray) {
				params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
			}
			params += "&image_type=barangay_logo";
			params += "&directory=" + barangay.directory;
			// params += "&sub_directory=" + barangay.directory;

			const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
				headers: { ...form.getHeaders() },
			});
		}

		updateBarangay.logo = message.image_name;
	}

	if (req.files["image_cover_file"]?.[0]) {
		let form = new FormData();
		form.append("image_cover_file", req.files["image_cover_file"][0].buffer, {
			filename: req.files["image_cover_file"][0].originalname.replace(/ /g, ""),
			contentType: req.files["image_cover_file"][0].mimetype,
			knownLength: req.files["image_cover_file"][0].size,
		});

		form.append("image_type", "barangay_cover");
		form.append("directory", barangay.directory);
		// form.append("sub_directory", residentAccount.directory);

		try {
			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			if (barangay.cover_image_link) {
				const imageUrlsArray = [barangay.cover_image_link];
				let params = "?";
				for (let imageUrlIndex in imageUrlsArray) {
					params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
				}
				params += "&image_type=barangay_cover";
				params += "&directory=" + barangay.directory;
				// params += "&sub_directory=" + residentAccount.directory;

				const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
					headers: { ...form.getHeaders() },
				});
			}

			updateBarangay.cover_image_link = message.image_name;
		} catch (error) {
			console.log("IMAGEERROR", error, error.stack);
		}
	}

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY PROFILE",
		action: "UPDATE",
		description: `Updated barangay public profile`,
	});

	res.send({ message: "Data updated successfully!", affectedRow });
};

export const updateVisionMissionGoals = async (req, res) => {
	const { barangay_id } = req.params;

	const updateBarangay = {
		vision: req.body.vision,
		mission: req.body.mission,
		goals: req.body.goals,
	};

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY PROFILE",
		action: "UPDATE",
		description: `Updated Vision, Mission, Goals`,
	});

	res.send({ message: "Data updated successfully!", affectedRow });
};

export const updateLocation = async (req, res) => {
	const { barangay_id } = req.params;

	const updateBarangay = {
		lat: req.body.lat,
		lng: req.body.lng,
		address: capitalize.words(req.body.address?.trim() ?? "", true) || null,
	};

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY PROFILE",
		action: "UPDATE",
		description: `Updated barangay location`,
	});

	res.send({ message: "Data updated successfully!", affectedRow });
};

export const updateHealthSchedule = async (req, res) => {
	const { barangay_id } = req.params;

	const updateBarangay = {
		health_schedule: req.body.health_schedule.trim(),
	};

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY PROFILE",
		action: "UPDATE",
		description: `Updated barangay health schedule`,
	});

	res.send({ message: "Data updated successfully!", affectedRow });
};

export const updateCitizenCharter = async (req, res) => {
	const { barangay_id } = req.params;

	let updateBarangay = {};

	const barangay = await Barangay.findByPk(barangay_id);

	if (req.files["image_file"]?.[0]) {
		let form = new FormData();
		form.append("image_file", req.files["image_file"][0].buffer, {
			filename: req.files["image_file"][0].originalname.replace(/ /g, ""),
			contentType: req.files["image_file"][0].mimetype,
			knownLength: req.files["image_file"][0].size,
		});

		form.append("image_type", "barangay_citizen_charter");
		form.append("directory", barangay.directory);

		const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
			headers: { ...form.getHeaders() },
		});

		if (barangay.citizen_charter) {
			const imageUrlsArray = [barangay.citizen_charter];
			let params = "?";
			for (let imageUrlIndex in imageUrlsArray) {
				params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
			}
			params += "&image_type=barangay_citizen_charter";
			params += "&directory=" + barangay.directory;
			// params += "&sub_directory=" + barangay.directory;

			const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
				headers: { ...form.getHeaders() },
			});
		}

		updateBarangay.citizen_charter = message.image_name;
	}

	const affectedRow = await Barangay.update(updateBarangay, { where: { barangay_id } });

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY CITIZEN'S CHARTER",
		action: "UPDATED",
		description: `Updated Citizen's Charter`,
	});

	res.send({ message: "Data updated successfully!", affectedRow, citizen_charter: updateBarangay.citizen_charter });
};

// BARANGAY AUDITS

export const findAllAuditLogsByBarangay = (req, res) => {
	const { page = 0, size = 20, search, selected_module, action, filter_date, date_from, date_to, sortBy = "created_at", sortOrder = "DESC" } = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;
	const barangayDocumentCondition = {};
	const barangayCondition = {};

	Object.assign(barangayCondition, { barangay_id: barangay_id });

	let searchCondition = {};
	if (search) {
		searchCondition = {
			[Op.or]: [{ first_name: { [Op.like]: `%${search}%` } }],
		};
		// Object.assign(barangayDocumentCondition, searchCondition);
	}

	if (selected_module && selected_module != "ALL") {
		const statusCondition = {
			module: selected_module,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}

	if (action && action != "ALL") {
		const statusCondition = {
			action: action,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}

	//DATE FILTER
	if (filter_date && filter_date != "ALL" && date_from && date_to) {
		Object.assign(barangayDocumentCondition, {
			[filter_date]: { [Op.between]: [date_from, date_to] },
		});
	}

	return AuditLog.findAndCountAll({
		where: barangayDocumentCondition,
		include: {
			model: ResidentAccount,
			as: "audit_log",
			where: searchCondition,
			attributes: [
				"resident_account_id",
				"profile_image_link",
				"status",
				"directory",
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
			],
			include: [
				{
					model: BarangayRole,
					required: true,
					as: "role",
					attributes: ["barangay_role_id", "name"],
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
		},
		limit,
		offset,
		order: [[sortBy, sortOrder]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message, stack: err.stack });
		});
};
