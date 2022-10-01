import db from "../models/index.js";

const Barangay = db.sequelize.models.Barangay;
const BarangayHotline = db.sequelize.models.BarangayHotline;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	const barangay_id = req.params.barangay_id;

	try {
		const data = await BarangayHotline.create({
			barangay_id,
			name: req.body.name,
			number: req.body.number,
		});

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

const formatPaginatedData = (data, page, limit) => {
	const { count: totalItems, rows: rows } = data;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);
	return { totalItems, rows, totalPages, currentPage, rowPerPage: limit };
};

export const findAll = (req, res) => {
	const { page, size, name, number } = req.query;
	const { limit, offset } = getPagination(page, size);

	//return rows: barangay_id: 12, hotlines: [ ...hotlines ]
	// return Barangay.findAndCountAll({
	// 	where: null,
	// 	limit,
	// 	offset,
	// 	include: { model: BarangayHotline, attributes: ["barangay_hotline_id", "name", "number", "created_at", "updated_at"], required: true, as: "hotlines" },
	// 	order: [["created_at", "DESC"]],
	// })
	// 	.then((data) => {
	// 		const response = formatPaginatedData(data, page, limit);
	// 		res.send(response);
	// 	})
	// 	.catch((err) => {
	// 		res.status(500).send({ message: err.message || "An error occured while retrieving data" });
	// 	});

	return BarangayHotline.findAndCountAll({
		where: null,
		limit,
		offset,
		include: { model: Barangay, attributes: [], required: true, as: "barangay" },
		attributes: [
			"barangay_hotline_id",
			"barangay_id",
			"name",
			"number",
			"created_at",
			"updated_at",
			[db.Sequelize.literal("`Barangay`.`name`"), "barangay_name"],
		],
		order: [["created_at", "DESC"]],
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
	const { page, size, name, number } = req.query;
	const { limit, offset } = getPagination(page, size);
	const barangay_id = req.params.barangay_id;
	console.log("FINDING HOTLINES BY BARANGAY...");

	return BarangayHotline.findAndCountAll({ where: { barangay_id }, limit, offset, order: [["created_at", "DESC"]] })
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export const findOne = async (req, res) => {
	const barangay_hotline_id = req.params.barangay_hotline_id;

	const data = await BarangayHotline.findByPk(barangay_hotline_id);

	return data ? res.send(data) : res.status(404).send({ message: `Not Found` });
};

export const update = async (req, res) => {
	const barangay_hotline_id = req.params.barangay_hotline_id;
	const barangay_id = req.params.barangay_id;

	const data = { ...req.body };
	console.log(data);
	//TODO: check session if he/she is a barangay admin.

	const affectedRow = await BarangayHotline.update(data, { where: { barangay_hotline_id } });
	console.log(affectedRow);
	if (!affectedRow) res.status(404).send({ message: `Not Found` });
	res.send({ message: "Data updated successfully!" });
};

export const destroy = async (req, res) => {
	const barangay_hotline_id = req.params.barangay_hotline_id;

	const affectedRow = await BarangayHotline.destroy({ where: { barangay_hotline_id } });
	if (!affectedRow) res.status(404).send({ message: `Not Found` });
	res.send({ message: "Data deleted successfully" });
};
