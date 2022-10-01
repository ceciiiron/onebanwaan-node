import db from "../models/index.js";

const BarangayRole = db.sequelize.models.BarangayRole;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	try {
		// await uploadFileMiddleware.uploadFile(req, res);

		// if (!req.file) return res.status(400).send({ message: `Could not upload data: Logo is required` });

		const barangay = {
			name: req.body.name,
			number: req.body.number,
			bio: req.body.bio,
			address: req.body.address,
		};

		const newBarangay = await Barangay.create(barangay);

		res.send(newBarangay);
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

const getPagination = (page, size) => {
	const limit = size ? +size : 3;
	const offset = page ? page * limit : 0;
	return { limit, offset };
};

const formatPaginatedData = (data, page, limit) => {
	const { count: totalItems, rows: barangays } = data;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);
	return { totalItems, barangays, totalPages, currentPage, rowPerPage: limit };
};

export const findAll = (req, res) => {
	const { page, size, name, number } = req.query;
	const { limit, offset } = getPagination(page, size);
	let condition = {};

	if (name) {
		condition.name = { [Op.like]: `%${name}%` };
	}

	if (number) {
		condition.number = { [Op.like]: `%${number}%` };
	}

	return Barangay.findAndCountAll({ where: condition, limit, offset, order: [["created_at", "DESC"]] })
		.then((data) => {
			const response = formatPaginatedData(data, page, limit);
			res.send(response);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message || "An error occured while retrieving data" });
		});
};

export const findOne = async (req, res) => {
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
