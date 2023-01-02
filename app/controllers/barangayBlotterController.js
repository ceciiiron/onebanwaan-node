import db from "../models/index.js";
import capitalize from "capitalize";
import FormData from "form-data";
import axios from "axios";

const Barangay = db.sequelize.models.Barangay;
const BarangayDocumentRequest = db.sequelize.models.BarangayDocumentRequest;
const BarangayDocumentSetting = db.sequelize.models.BarangayDocumentSetting;
const BarangayBlotter = db.sequelize.models.BarangayBlotter;
const BarangayCaseType = db.sequelize.models.BarangayCaseType;
const Op = db.Sequelize.Op;

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
	const { page = 0, size = 20, search, filter_date, date_from, date_to, sortBy = "created_at", sortOrder = "DESC" } = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;
	const barangayBlotterCondition = {};
	// const documentTypeCondition = {};

	Object.assign(barangayBlotterCondition, { barangay_id: barangay_id });

	if (search) {
		const searchCondition = {
			[Op.or]: [{ complainants: { [Op.like]: `%${search}%` } }, { complainants: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `${search}%` } }],
		};
		Object.assign(barangayBlotterCondition, searchCondition);
	}

	// if (document_type_id && document_type_id != "ALL") {
	// 	const condition = {
	// 		document_type_id: document_type_id,
	// 	};
	// 	Object.assign(documentTypeCondition, condition);
	// }

	// if (request_status && request_status != "ALL") {
	// 	const statusCondition = {
	// 		request_status: request_status,
	// 	};
	// 	Object.assign(barangayBlotterCondition, statusCondition);
	// }

	// if (payment_status && payment_status != "ALL") {
	// 	const statusCondition = {
	// 		payment_status: payment_status,
	// 	};
	// 	Object.assign(barangayBlotterCondition, statusCondition);
	// }
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
