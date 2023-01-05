import db from "../models/index.js";
import capitalize from "capitalize";
import FormData from "form-data";
import axios from "axios";

const Barangay = db.sequelize.models.Barangay;
const BarangayDocumentRequest = db.sequelize.models.BarangayDocumentRequest;
const BarangayDocumentSetting = db.sequelize.models.BarangayDocumentSetting;
const BarangayBlotter = db.sequelize.models.BarangayBlotter;
const BarangayCaseType = db.sequelize.models.BarangayCaseType;
const AuditLog = db.sequelize.models.AuditLog;
const Op = db.Sequelize.Op;

const reportStatusText = (status) => {
	switch (status) {
		case 1:
			return "pending";
			break;
		case 2:
			return "verified";
			break;
		default:
			return "false report";
			break;
	}
};

export const create = async (req, res) => {
	try {
		const newBlotter = {
			barangay_id: req.body.barangay_id,
			complainants: req.body.complainants,
			respondents: req.body.respondents,
			witnesses: req.body.witnesses,

			incident_date: req.body.incident_date,
			incident_details: req.body.incident_details,
			incident_location: req.body.incident_location,

			contact_number: req.body.contact_number ? req.body.contact_number.trim() : null,
			email: req.body.email ? req.body.email.trim() : null,
		};

		const barangay = await Barangay.findByPk(newBlotter.barangay_id);

		if (req.file) {
			let form = new FormData();
			form.append("image_file", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});

			form.append("image_type", "barangay_blotter");
			form.append("directory", barangay.directory);

			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			newBlotter.evidence_link = message.image_name;
		}

		const insertedBlotter = await BarangayBlotter.create(newBlotter);

		/* ========================================================================== */

		res.status(201).send({
			message: {
				newBlotter,
			},
		});
	} catch (error) {
		//TODO: Delete image if it fails
		// await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/new`, { data: {req.file} });

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

export const findAllBlotterByBarangay = (req, res) => {
	const {
		page = 0,
		size = 20,
		search,
		filter_date,
		date_from,
		date_to,
		barangay_case_type_id,
		status,
		sortBy = "created_at",
		sortOrder = "DESC",
	} = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;
	const barangayBlotterCondition = {};
	// const documentTypeCondition = {};

	Object.assign(barangayBlotterCondition, { barangay_id: barangay_id });

	if (search) {
		const searchCondition = {
			[Op.or]: [
				{ complainants: { [Op.like]: `%${search}%` } },
				{ respondents: { [Op.like]: `%${search}%` } },
				{ email: { [Op.like]: `${search}%` } },
				{ contact_number: { [Op.like]: `${search}%` } },
			],
		};
		Object.assign(barangayBlotterCondition, searchCondition);
	}

	if (barangay_case_type_id && barangay_case_type_id != "ALL") {
		let barangayCaseTypeCondition = "";
		if (barangay_case_type_id != "UNLABELED") {
			barangayCaseTypeCondition = {
				barangay_case_type_id: barangay_case_type_id,
			};
			Object.assign(barangayBlotterCondition, barangayCaseTypeCondition);
		} else if (barangay_case_type_id === "UNLABELED") {
			barangayCaseTypeCondition = {
				barangay_case_type_id: { [Op.is]: null },
			};
			Object.assign(barangayBlotterCondition, barangayCaseTypeCondition);
		}
	}

	if (status && status != "ALL") {
		const statusCondition = {
			status: status,
		};
		Object.assign(barangayBlotterCondition, statusCondition);
	}
	//DATE FILTER
	if (filter_date && filter_date != "ALL" && date_from && date_to) {
		Object.assign(barangayBlotterCondition, {
			[filter_date]: { [Op.between]: [date_from, date_to] },
		});
	}

	return BarangayBlotter.findAndCountAll({
		where: barangayBlotterCondition,
		// include: [
		// 	{
		// 		model: BarangayDocumentSetting,
		// 		as: "barangay_document_settings",
		// 		required: true,
		// 		include: [
		// 			{
		// 				model: DocumentType,
		// 				as: "barangay_document_settings",
		// 				required: true,
		// 				where: documentTypeCondition,
		// 			},
		// 		],
		// 	},
		// ],
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

export const findAllCaseTypes = async (req, res) => {
	try {
		const cases = await BarangayCaseType.findAll();
		res.status(200).send({ cases });
	} catch (error) {
		res.status(500).send({ message: error.message });
	}
};

export const findOne = async (req, res) => {
	const { barangay_blotter_id } = req.params;

	const data = await BarangayBlotter.findByPk(barangay_blotter_id, {
		// include: [
		// 	{
		// 		model: BarangayDocumentSetting,
		// 		as: "barangay_document_settings",
		// 		include: [
		// 			{
		// 				model: DocumentType,
		// 				as: "barangay_document_settings",
		// 				// attributes: [],
		// 				// required: true,
		// 			},
		// 		],
		// 	},
		// ],
	});

	return data ? res.send(data) : res.status(404).send({ message: `Hotline not found` });
};

export const updateStatus = async (req, res) => {
	const { barangay_blotter_id } = req.params;

	const currentRequest = await BarangayBlotter.findByPk(barangay_blotter_id);

	try {
		let barangayBlotter = {
			status: req.body.status,
		};

		if (req.body.remarks) {
			barangayBlotter.remarks = req.body.remarks;
		}

		await BarangayBlotter.update(barangayBlotter, { where: { barangay_blotter_id } });

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BLOTTER RECORDS",
			action: "UPDATE",
			description: `Updated status of B${barangay_blotter_id} from ${reportStatusText(currentRequest.status)} to ${reportStatusText(
				barangayBlotter.status
			)}`,
		});

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updateCaseType = async (req, res) => {
	const { barangay_blotter_id } = req.params;

	try {
		let barangayBlotter = {
			barangay_case_type_id: req.body.barangay_case_type_id === "UNLABELED" ? null : req.body.barangay_case_type_id,
		};

		await BarangayBlotter.update(barangayBlotter, { where: { barangay_blotter_id } });

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BLOTTER RECORDS",
			action: "UPDATE",
			description: `Updated case type of B${barangay_blotter_id}`,
		});

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updateNarrative = async (req, res) => {
	const { barangay_blotter_id } = req.params;

	try {
		let barangayBlotter = {
			narrative: !req.body.narrative ? null : req.body.narrative,
		};

		await BarangayBlotter.update(barangayBlotter, { where: { barangay_blotter_id } });

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BLOTTER RECORDS",
			action: "UPDATE",
			description: `Updated narrative of B${barangay_blotter_id}`,
		});

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};
