import db from "../models/index.js";
import capitalize from "capitalize";
import FormData from "form-data";
import axios from "axios";

const Barangay = db.sequelize.models.Barangay;
const BarangayHotline = db.sequelize.models.BarangayHotline;
const BarangayOfficial = db.sequelize.models.BarangayOfficial;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const AuditLog = db.sequelize.models.AuditLog;
const BarangayOrdinance = db.sequelize.models.BarangayOrdinance;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	const { barangay_id } = req.params;

	try {
		const newOrdinance = {
			barangay_id: barangay_id,
			title: capitalize.words(req.body.title?.trim() ?? "", true) || null,
			description: req.body.details,
		};

		const barangay = await Barangay.findByPk(barangay_id);

		if (req.file) {
			let form = new FormData();
			form.append("image_file", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});

			form.append("image_type", "barangay_ordinance");
			form.append("directory", barangay.directory);

			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			newOrdinance.ordinance_link = message.image_name;
		}

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY ORDINANCES",
			action: "CREATE",
			description: `Created ${newOrdinance.title}`,
		});

		const newData = await BarangayOrdinance.create(newOrdinance);

		res.status(201).send(newData);
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

export const findAllByBarangay = (req, res) => {
	const { page, size = 10 } = req.query;
	// const { limit, offset } = getPagination(page, size);
	const barangay_id = req.params.barangay_id;

	return BarangayOrdinance.findAndCountAll({ where: { barangay_id }, order: [["updated_at", "DESC"]] })
		.then((data) => {
			// const response = formatPaginatedData(data, page, limit);
			res.send(data);
		})
		.catch((err) => {
			res.status(500).send({ message: err.message });
		});
};

export const findOne = async (req, res) => {
	const { barangay_ordinance_id } = req.params;

	const data = await BarangayOrdinance.findByPk(barangay_ordinance_id);

	return data ? res.send(data) : res.status(404).send({ message: `Ordinance not found` });
};

export const update = async (req, res) => {
	const { barangay_id, barangay_ordinance_id } = req.params;

	try {
		const updateOrdinance = {
			title: capitalize.words(req.body.title?.trim() ?? "", true) || null,
			description: req.body.details,
		};

		const barangay = await Barangay.findByPk(barangay_id);

		if (req.file) {
			let form = new FormData();
			form.append("image_file", req.file.buffer, {
				filename: req.file.originalname.replace(/ /g, ""),
				contentType: req.file.mimetype,
				knownLength: req.file.size,
			});

			form.append("image_type", "barangay_ordinance");
			form.append("directory", barangay.directory);

			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/singleimage`, form, {
				headers: { ...form.getHeaders() },
			});

			if (barangay.ordinance_link) {
				const imageUrlsArray = [barangay.ordinance_link];
				let params = "?";
				for (let imageUrlIndex in imageUrlsArray) {
					params += `image_files[]=${imageUrlsArray[imageUrlIndex]}`;
				}
				params += "&image_type=barangay_ordinance";
				params += "&directory=" + barangay.directory;
				// params += "&sub_directory=" + barangay.directory;

				const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
					headers: { ...form.getHeaders() },
				});
			}

			updateOrdinance.ordinance_link = message.image_name;
		}

		const affectedRow = await BarangayOrdinance.update(updateOrdinance, { where: { barangay_ordinance_id } });
		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY ORDINANCES",
			action: "UPDATE",
			description: `Updated ${updateOrdinance.title}`,
		});
		res.status(201).send({ affectedRow, updateOrdinance });
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
	}
};

export const destroy = async (req, res) => {
	const { barangay_ordinance_id } = req.params;

	const affectedRow = await BarangayOrdinance.destroy({ where: { barangay_ordinance_id } });

	//Delete the file
	await AuditLog.create({
		resident_account_id: req.session.user.resident_account_id,
		module: "BARANGAY ORDINANCES",
		action: "DELETE",
		description: `Deleted a barangay ordinance`,
	});

	if (!affectedRow) res.status(404).send({ message: `Not Found` });
	res.status(200).send({ message: "Data deleted successfully" });
};
