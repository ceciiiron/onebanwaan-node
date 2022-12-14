import db from "../models/index.js";

const Barangay = db.sequelize.models.Barangay;
const BarangayHotline = db.sequelize.models.BarangayHotline;
const BarangayDocumentSetting = db.sequelize.models.BarangayDocumentSetting;
const DocumentType = db.sequelize.models.DocumentType;
const AuditLog = db.sequelize.models.AuditLog;
const Op = db.Sequelize.Op;

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

export const findAll = (req, res) => {
	const { page = 0, size = 20, search, barangay_id } = req.query;
	const { limit, offset } = getPagination(page, size);

	let hotlineCondition = {};

	if (barangay_id && barangay_id != "ALL") {
		const searchBarangayCondition = {
			barangay_id: barangay_id,
		};
		Object.assign(hotlineCondition, searchBarangayCondition);
	}

	if (search) {
		const searchCondition = {
			[Op.or]: [{ name: { [Op.like]: `${search}%` } }, { number: { [Op.like]: `${search}%` } }],
		};
		Object.assign(hotlineCondition, searchCondition);
	}

	return BarangayHotline.findAndCountAll({
		where: hotlineCondition,
		limit,
		offset,
		attributes: [
			"barangay_hotline_id",
			"barangay_id",
			"name",
			"number",
			"created_at",
			"updated_at",
			// [db.sequelize.fn("DATE_FORMAT", db.sequelize.col(`BarangayHotlines.updated_at`), "%m-%d-%Y %H:%i:%s"), "updated_at"],
			// [db.Sequelize.literal("`Barangay`.`name`"), "barangay_name"],
		],
		include: { model: Barangay, attributes: ["name", "logo", "number"], required: true, as: "barangay" },
		order: [["name", "ASC"]],
	})
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export const findAllByBarangay = (req, res) => {
	const { page, size = 10, name, number } = req.query;
	const { limit, offset } = getPagination(page, size);
	const { barangay_id } = req.params;

	return BarangayDocumentSetting.findAndCountAll({
		where: { barangay_id },
		include: [
			{
				model: DocumentType,
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
			validity: req.body.validity,
			other_requirements: req.body.other_requirements,
		};

		await BarangayDocumentSetting.update(barangayDocumentSetting, { where: { barangay_document_setting_id } });

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "DOCUMENT SETTINGS",
			action: "UPDATE",
			description: `Updated Document Setting`,
		});

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};
