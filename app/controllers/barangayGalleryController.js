import db from "../models/index.js";
import capitalize from "capitalize";
import FormData from "form-data";
import axios from "axios";
import { nanoid } from "nanoid";

const Barangay = db.sequelize.models.Barangay;
const BarangayGallery = db.sequelize.models.BarangayGallery;
const BarangayGalleryImage = db.sequelize.models.BarangayGalleryImage;

const ResidentAccount = db.sequelize.models.ResidentAccount;
const AuditLog = db.sequelize.models.AuditLog;
const BarangayOrdinance = db.sequelize.models.BarangayOrdinance;
const Op = db.Sequelize.Op;

export const create = async (req, res) => {
	const { barangay_id } = req.params;

	try {
		const newGallery = {
			barangay_id: barangay_id,
			name: capitalize.words(req.body.name?.trim() ?? "", true) || null,
			description: req.body.description?.trim(),
			directory: nanoid(12),
		};

		const createdGallery = await BarangayGallery.create(newGallery);

		const barangay = await Barangay.findByPk(barangay_id);

		if (req.files.length > 0) {
			let form = new FormData();

			req.files.forEach((file) => {
				form.append("image_files[]", file.buffer, {
					filename: file.originalname.replace(/ /g, ""),
					contentType: file.mimetype,
					knownLength: file.size,
				});

				console.log(file);
			});

			//FOR IMPROVEMENTS, do not create the derectory until verified;
			form.append("image_type", "barangay_gallery");
			form.append("directory", barangay.directory);
			form.append("sub_directory", newGallery.directory);

			try {
				const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/multipleimages`, form, {
					headers: { ...form.getHeaders() },
				});
				//Under posts directory

				message.image_urls.forEach(async (obj) => {
					await BarangayGalleryImage.create({
						barangay_gallery_id: createdGallery.barangay_gallery_id,
						link: obj.image_url,
					});
				});

				console.log(message.image_urls);
			} catch (error) {
				console.log(error);
				res.status(500).send({ message: `Could not upload photos: ${error}`, stack: error.stack, error });
			}
		}

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY GALLERY",
			action: "CREATE",
			description: `Created ${newGallery.name}`,
		});

		res.status(201).send(createdGallery);
	} catch (error) {
		res.status(500).send({ message: `Could not insert data: ${error}` });
	}
};

export const createImage = async (req, res) => {
	const { barangay_id, barangay_gallery_id } = req.params;

	try {
		const barangay = await Barangay.findByPk(barangay_id);
		const gallery = await BarangayGallery.findByPk(barangay_gallery_id);

		// if (req.files.length > 0) {
		let form = new FormData();

		req.files.forEach((file) => {
			form.append("image_files[]", file.buffer, {
				filename: file.originalname.replace(/ /g, ""),
				contentType: file.mimetype,
				knownLength: file.size,
			});

			console.log(file);
		});

		//FOR IMPROVEMENTS, do not create the derectory until verified;
		form.append("image_type", "barangay_gallery");
		form.append("directory", barangay.directory);
		form.append("sub_directory", gallery.directory);

		let newImages = [];

		try {
			const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/multipleimages`, form, {
				headers: { ...form.getHeaders() },
			});
			//Under posts directory

			message.image_urls.forEach(async (obj) => {
				newImages.push(
					await BarangayGalleryImage.create({
						barangay_gallery_id: barangay_gallery_id,
						link: obj.image_url,
					})
				);
			});

			console.log(message.image_urls);
			// urls = message.image_urls;
		} catch (error) {
			console.log(error);
			res.status(500).send({ message: `Could not upload photos: ${error}`, stack: error.stack, error });
		}
		// }

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY GALLERY",
			action: "CREATE",
			description: `Added images to ${gallery.name}`,
		});

		res.status(201).send({ newImages });
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

export const findAllByBarangay = async (req, res) => {
	const { page, size = 10 } = req.query;
	// const { limit, offset } = getPagination(page, size);
	const barangay_id = req.params.barangay_id;

	try {
		const [rs, md] = await db.sequelize.query(
			`SELECT * FROM BarangayGalleries 
				JOIN (SELECT BarangayGalleryImages.link, BarangayGalleryImages.barangay_gallery_id FROM BarangayGalleryImages GROUP BY BarangayGalleryImages.barangay_gallery_id ORDER BY BarangayGalleryImages.created_at DESC LIMIT 1 ) BGI ON BGI.barangay_gallery_id = BarangayGalleries.barangay_gallery_id 
				JOIN (SELECT COUNT(BarangayGalleryImages.barangay_gallery_image_id) as total, barangay_gallery_id FROM BarangayGalleryImages GROUP BY BarangayGalleryImages.barangay_gallery_id) TotalQuery ON TotalQuery.barangay_gallery_id =  BarangayGalleries.barangay_gallery_id
				WHERE BarangayGalleries.barangay_id = $barangay_id;`,
			{
				bind: {
					barangay_id: barangay_id,
				},
			}
		);

		res.status(200).send(rs ?? []);
	} catch (error) {
		res.status(500).send({ message: `Could not fetch data: ${error}`, stack: error.stack });
	}
};

export const findOne = async (req, res) => {
	const { barangay_gallery_id } = req.params;

	const data = await BarangayGallery.findByPk(barangay_gallery_id, {
		include: [
			{
				model: Barangay,
				as: "barangay_gallery",
			},
			{
				model: BarangayGalleryImage,

				as: "main_gallery",
				// order: ["created_at", "DESC"],
			},
		],
		order: [[{ model: BarangayGalleryImage, as: "main_gallery" }, "created_at", "DESC"]],
	});

	return data ? res.status(200).send(data) : res.status(404).send({ message: `Ordinance not found` });
};

export const updateDetails = async (req, res) => {
	const { barangay_gallery_id } = req.params;

	const currentGallery = await BarangayGallery.findByPk(barangay_gallery_id);

	try {
		const updatedBarangayGallery = {
			name: capitalize.words(req.body.name?.trim() ?? "", true) || null,
			description: req.body.description,
		};

		await BarangayGallery.update(updatedBarangayGallery, { where: { barangay_gallery_id } });

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY GALLERY",
			action: "UPDATE",
			description: `Updated ${currentGallery.name} details`,
		});

		res.send({ message: "Data updated successfully!" });
	} catch (error) {
		//delete file
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const destroy = async (req, res) => {
	const { barangay_id, barangay_gallery_id, barangay_gallery_image_id } = req.params;

	const barangay = await Barangay.findByPk(barangay_id);
	const gallery = await BarangayGallery.findByPk(barangay_gallery_id);
	const selectedImage = await BarangayGalleryImage.findByPk(barangay_gallery_image_id);

	try {
		let form = new FormData();
		let imageUrlsArray = [];
		imageUrlsArray.push(selectedImage.link);
		let params = "?";
		for (let imageUrlIndex in imageUrlsArray) {
			params += `${imageUrlIndex != 0 ? "&" : ""}image_files[]=${imageUrlsArray[imageUrlIndex]}`;
		}
		params += "&image_type=barangay_gallery";
		params += "&directory=" + barangay.directory;
		params += "&sub_directory=" + gallery.directory;

		const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
			headers: { ...form.getHeaders() },
		});
		console.log("DELTED FILES", deleteImageMessage);
		console.log("PARAMS", params);
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: error });
	}

	try {
		const data = await BarangayGalleryImage.destroy({
			where: { barangay_gallery_image_id },
		});

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY GALLERY",
			action: "DELETE",
			description: `Deleted an image from ${gallery.name}`,
		});

		res.send({ message: "Data deleted successfully!", data });
	} catch (error) {
		res.status(500).send({ message: error });
	}
};

export const destroyGallery = async (req, res) => {
	const { barangay_id, barangay_gallery_id } = req.params;

	// const barangay = await Barangay.findByPk(barangay_id);
	const gallery = await BarangayGallery.findByPk(barangay_gallery_id);

	try {
		const data = await BarangayGallery.destroy({
			where: { barangay_gallery_id },
		});

		await AuditLog.create({
			resident_account_id: req.session.user.resident_account_id,
			module: "BARANGAY GALLERY",
			action: "DELETE",
			description: `Deleted ${gallery.name}`,
		});

		res.send({ message: "Data deleted successfully!", data });
	} catch (error) {
		res.status(500).send({ message: error });
	}
};
