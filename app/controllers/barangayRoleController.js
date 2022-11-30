import db from "../models/index.js";

const BarangayRole = db.sequelize.models.BarangayRole;
const BarangayPermission = db.sequelize.models.BarangayPermission;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	try {
		const barangayRole = {
			name: req.body.name,
			barangay_id: req.body.barangay_id,
		};

		//Also add the permissions
		const newBarangayRole = await Barangay.create(barangay);

		res.send(newBarangayRole);
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

const formatPaginatedData = (fetchedData, page, limit) => {
	const { count: totalItems, rows: data } = fetchedData;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);
	return { totalItems, data, totalPages, currentPage, rowPerPage: limit };
};

export const findAllByBarangayPaginated = (req, res) => {
	const { page = 0, size = 10, search, sortBy = "updated_at", sortOrder = "DESC" } = req.query;
	const barangay_id = req.params.barangay_id;
	const { limit, offset } = getPagination(page, size);

	BarangayRole.findAndCountAll({
		where: { barangay_id },
		limit,
		offset,
		attributes: [
			"name",
			"barangay_role_id",
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
			res.status(500).send({ message: err.message });
		});
};

export const findAllByBarangay = (req, res) => {
	const { with_permissions = 0 } = req.query;
	const barangay_id = req.params.barangay_id;

	const includePermissions = {
		model: BarangayPermission,
		as: "barangay_role_permissions",
	};

	BarangayRole.findAndCountAll({
		attributes: [
			"name",
			"barangay_role_id",
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("created_at"), "%d-%m-%Y %H:%i:%s"), "created_at"],
			[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("updated_at"), "%d-%m-%Y %H:%i:%s"), "updated_at"],
		],
		include: with_permissions ? includePermissions : null,
		where: { barangay_id },
		order: [["created_at", "DESC"]],
	})
		.then((fetchedData) => {
			const { count, rows: data } = fetchedData;
			res.send({ count, data });
		})
		.catch((err) => {
			res.status(500).send({ message: err.message });
		});
};

export const findOne = async (req, res) => {
	const id = req.params.id;

	try {
		const barangay = await Barangay.findByPk(id);

		return barangay ? res.send(barangay) : res.status(404).send({ message: `Barangay role not found` });
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
