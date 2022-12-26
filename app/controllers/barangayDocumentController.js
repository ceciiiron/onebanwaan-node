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
	const { page = 0, size = 20, search } = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;

	return BarangayDocumentRequest.findAndCountAll({
		where: { barangay_id },
		include: [
			{
				model: BarangayDocumentSetting,
				as: "barangay_document_settings",
				// attributes: [],
				// required: true,
			},
		],
		limit,
		offset,
		order: [["updated_at", "DESC"]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message });
		});
};

export const findOne = async (req, res) => {
	const { barangay_id } = req.params;

	const data = await BarangayHotline.findByPk(barangay_hotline_id);

	return data ? res.send(data) : res.status(404).send({ message: `Hotline not found` });
};

export const update = async (req, res) => {
	const { barangay_document_setting_id } = req.params;

	try {
		const barangayDocumentSetting = {
			fee: req.body.fee,
			other_requirements: req.body.other_requirements,
		};

		await BarangayDocumentSetting.update(barangayDocumentSetting, { where: { barangay_document_setting_id } });

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};
