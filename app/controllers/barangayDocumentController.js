import db from "../models/index.js";
import capitalize from "capitalize";

const Barangay = db.sequelize.models.Barangay;
const BarangayHotline = db.sequelize.models.BarangayHotline;
const BarangayDocumentRequest = db.sequelize.models.BarangayDocumentRequest;
const BarangayDocumentSetting = db.sequelize.models.BarangayDocumentSetting;
const DocumentType = db.sequelize.models.DocumentType;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	const { barangay_id } = req.params;

	try {
		const barangayDocumentRequest = {
			barangay_id,
			full_name: capitalize.words(req.body.full_name?.trim() ?? "", true) || null,
			home_address: capitalize.words(req.body.home_address?.trim() ?? "", true) || null,
			age: req.body.age,
			birthdate: req.body.birthdate,
			gender: req.body.gender,
			civil_status: req.body.civil_status,
			contact_number: req.body.contact_number ? req.body.contact_number.trim() : null,
			email: req.body.email ? req.body.email.trim() : null,
			barangay_document_setting_id: req.body.barangay_document_setting_id,
			purpose: req.body.purpose,
			captured_fee: req.body.captured_fee,
			claim_date: req.body.claim_date,
			ticket_code: req.body.ticket_code,
			request_status: req.body.request_status,
			payment_status: req.body.payment_status,
		};

		const data = await BarangayDocumentRequest.create(barangayDocumentRequest);

		res.send(data);
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
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

export const findEverything = (req, res) => {
	return BarangayHotline.findAll({
		attributes: [
			"barangay_hotline_id",
			"barangay_id",
			"name",
			"number",
			// "created_at",
			// "updated_at",
			// [db.sequelize.fn("DATE_FORMAT", db.sequelize.col(`BarangayHotlines.updated_at`), "%m-%d-%Y %H:%i:%s"), "updated_at"],
			// [db.Sequelize.literal("`Barangay`.`name`"), "barangay_name"],
		],
		include: { model: Barangay, attributes: ["name", "logo", "number"], required: true, as: "barangay" },
		order: [["name", "ASC"]],
	})
		.then((data) => {
			// const response = formatPaginatedData(data, page, limit);
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export const findAllRequestsByBarangay = (req, res) => {
	const { page = 0, size = 20, search, request_status, document_type_id, payment_status, sortBy = "created_at", sortOrder = "DESC" } = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;
	const barangayDocumentCondition = {};
	const documentTypeCondition = {};

	Object.assign(barangayDocumentCondition, { barangay_id: barangay_id });

	if (search) {
		const searchCondition = {
			[Op.or]: [{ full_name: { [Op.like]: `${search}%` } }, { ticket_code: { [Op.like]: `${search}%` } }, { email: { [Op.like]: `${search}%` } }],
		};
		Object.assign(barangayDocumentCondition, searchCondition);
	}

	if (document_type_id && document_type_id != "ALL") {
		const condition = {
			document_type_id: document_type_id,
		};
		Object.assign(documentTypeCondition, condition);
	}

	if (request_status && request_status != "ALL") {
		const statusCondition = {
			request_status: request_status,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}

	if (payment_status && payment_status != "ALL") {
		const statusCondition = {
			payment_status: payment_status,
		};
		Object.assign(barangayDocumentCondition, statusCondition);
	}

	return BarangayDocumentRequest.findAndCountAll({
		where: barangayDocumentCondition,
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				required: true,
				include: [
					{
						model: DocumentType,
						as: "barangay_document_settings",
						required: true,
						// attributes: [],
						// required: true,
						where: documentTypeCondition,
					},
				],
			},
		],
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

export const findOne = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	const data = await BarangayDocumentRequest.findByPk(barangay_document_request_id, {
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
	});

	return data ? res.send(data) : res.status(404).send({ message: `Hotline not found` });
};

export const updatePaymentStatus = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	try {
		let barangayDocumentRequest = {
			payment_status: req.body.payment_status,
		};

		if (req.body.paid_at) {
			barangayDocumentRequest.paid_at = req.body.paid_at;
		}

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updateRequestStatus = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	try {
		let barangayDocumentRequest = {
			request_status: req.body.request_status,
		};

		if (req.body.remarks) {
			barangayDocumentRequest.remarks = req.body.remarks;
		}

		if (req.body.issued_at) {
			barangayDocumentRequest.issued_at = req.body.issued_at;
		}

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updatePersonalInformation = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	try {
		const barangayDocumentRequest = {
			full_name: capitalize.words(req.body.full_name?.trim() ?? "", true) || null,
			home_address: capitalize.words(req.body.home_address?.trim() ?? "", true) || null,
			age: req.body.age,
			birthdate: req.body.birthdate,
			gender: req.body.gender,
			civil_status: req.body.civil_status,
			contact_number: req.body.contact_number ? req.body.contact_number?.trim() : null,
		};

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const updateDocumentInformation = async (req, res) => {
	const { barangay_document_request_id } = req.params;

	try {
		const barangayDocumentRequest = {
			purpose: req.body.purpose,
			captured_fee: req.body.captured_fee,
		};

		await BarangayDocumentRequest.update(barangayDocumentRequest, { where: { barangay_document_request_id } });

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};
