import db from "../models/index.js";
import capitalize from "capitalize";

const BarangayRole = db.sequelize.models.BarangayRole;
const BarangayPermission = db.sequelize.models.BarangayPermission;
const BarangayRolePermission = db.sequelize.models.BarangayRolePermission;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const AuditLog = db.sequelize.models.AuditLog;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	const barangay_id = req.params.barangay_id;

	try {
		const barangayRole = {
			name: capitalize.words(req.body.name?.trim() ?? "", true),
			barangay_id,
		};

		const newBarangayRole = await BarangayRole.create(barangayRole);

		const rolePermissions = [];
		req.body.barangay_permission_id.forEach((element) => {
			rolePermissions.push({ barangay_role_id: newBarangayRole.barangay_role_id, barangay_permission_id: element });
		});

		const results = BarangayRolePermission.bulkCreate(rolePermissions);

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "ACCOUNT ROLES",
			action: "CREATE",
			description: `Created ${barangayRole.name}`,
		});

		res.status(201).send({ rolePermissions, results });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const findAllPermissions = async (req, res) => {
	try {
		const permissions = await BarangayPermission.findAll();
		res.status(200).send({ permissions });
	} catch (error) {
		res.status(500).send({ message: error.message });
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
	let condition = {};
	condition.barangay_id = barangay_id;

	if (search) {
		condition.name = { [Op.like]: `%${search}%` };
	}

	BarangayRole.findAndCountAll({
		where: condition,
		limit,
		offset,
		attributes: [
			"name",
			"barangay_role_id",
			[
				db.sequelize.literal(`(SELECT COUNT(*) FROM ResidentAccounts as accounts WHERE accounts.barangay_role_id = BarangayRole.barangay_role_id)`),
				"number_of_accounts",
			],
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
	const id = req.params.barangay_role_id;

	try {
		const barangay = await BarangayRole.findByPk(id, {
			include: {
				model: BarangayPermission,
				as: "barangay_role_permissions",
			},
		});

		return barangay ? res.send(barangay) : res.status(404).send({ message: `Barangay role not found` });
	} catch (error) {
		res.status(500).send({ message: `An error occured while retrieving data: ${error}` });
	}
};

export const update = async (req, res) => {
	const { barangay_role_id } = req.params;

	try {
		const barangayRole = {
			name: capitalize.words(req.body.name?.trim() ?? "", true),
		};

		await BarangayRole.update(barangayRole, { where: { barangay_role_id } });

		await BarangayRolePermission.destroy({ where: { barangay_role_id } });

		const rolePermissions = [];
		req.body.barangay_permission_id.forEach((element) => {
			rolePermissions.push({ barangay_role_id: barangay_role_id, barangay_permission_id: element });
		});

		const results = BarangayRolePermission.bulkCreate(rolePermissions);

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "ACCOUNT ROLES",
			action: "UPDATE",
			description: `Updated ${barangayRole.name}`,
		});

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const destroy = async (req, res) => {
	const { barangay_role_id } = req.params;

	const resident = await ResidentAccount.findOne({ where: { barangay_role_id: barangay_role_id } });

	//check if a role has existing connected resident acount
	if (resident !== null) {
		return res.status(400).send({
			error: {
				msg: "delete_error",
				param: "server_error",
			},
		});
	}

	const brole = await BarangayRole.findByPk(barangay_role_id);

	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "ACCOUNT ROLES",
		action: "DELETE",
		description: `Deleted ${brole.name}`,
	});

	await BarangayRole.destroy({
		where: { barangay_role_id },
	})
		.then((data) => {
			res.send({ message: "Data deleted successfully!" });
		})
		.catch((err) => {
			res.status(400).send({ message: err });
		});
};
