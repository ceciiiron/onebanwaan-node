import db from "../models/index.js";
import dayjs from "dayjs";
import capitalize from "capitalize";
import bcrypt from "bcryptjs";

const Barangay = db.sequelize.models.Barangay;
const ResidentAccount = db.sequelize.models.ResidentAccount;
const BarangayRole = db.sequelize.models.BarangayRole;
const Post = db.sequelize.models.Post;
const PostImage = db.sequelize.models.PostImage;
const PostHeart = db.sequelize.models.PostHeart;
const Op = db.Sequelize.Op;

import axios from "axios";
import FormData from "form-data";
// import { nanoid } from "nanoid";

/* ========================================================================== */
/*                               CREATE POST                                  */
/* ========================================================================== */
export const create = async (req, res) => {
	try {
		const post = {
			resident_account_id: req.session.user.resident_account_id,
			// resident_account_id: req.body.resident_account_id,
			post_type_id: req.body.post_type_id === "None" ? null : req.body.post_type_id,
			barangay_id: req.body.barangay_id == "None" ? null : req.body.barangay_id,
			title: capitalize.words(req.body.title?.trim() ?? "", true) || null,
			content: req.body.content?.trim() || null,
			privacy: req.body.privacy || null,
			as_barangay_admin: req.body.as_barangay_admin || null,
		};

		console.log("POST DATA (❁´◡`❁)", req.body);
		console.log("IMAGE FILES", req.files);

		const residentAccount = await ResidentAccount.findByPk(post.resident_account_id, {
			attributes: [
				"barangay_role_id",
				"directory",
				[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("ResidentAccount.created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
				[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("ResidentAccount.updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
			],
			include: {
				model: BarangayRole,
				attributes: ["barangay_id"],
				required: true,
				as: "role",
				include: [
					{
						attributes: ["directory"],
						model: Barangay,
						as: "barangay",
					},
				],
			},
		});

		const newPost = await Post.create(post);

		if (req.files.length > 0) {
			console.log("MAY LAMAN YUNG FILES");
			let form = new FormData();

			req.files.forEach((file) => {
				form.append("image_files[]", file.buffer, {
					filename: file.originalname.replace(/ /g, ""),
					contentType: file.mimetype,
					knownLength: file.size,
				});

				console.log(file);
			});

			form.append("directory", residentAccount.role.barangay.directory);
			form.append("sub_directory", residentAccount.directory);

			try {
				const { data: message } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/multipleimages`, form, {
					headers: { ...form.getHeaders() },
				});
			} catch (error) {
				console.log(error);
				res.status(500).send({ message: `Could not upload post: ${error}`, stack: error.stack, error });
			}

			//TODO: UPDATE TO INSERT BATCH
			message.image_urls.forEach(async (obj) => {
				await PostImage.create({
					post_id: newPost.post_id,
					image_link: obj.image_url,
				});
			});

			console.log(message.image_urls);
		}
		/* ========================================================================== */

		res.status(201).send(newPost);
		// res.status(201).send(post);
	} catch (error) {
		//TODO: Delete image if it fails

		res.status(500).send({ message: `Could not upload post: ${error}`, stack: error.stack });
	}
};

/* ========================================================================== */
/*                                FIND POST                                   */
/* ========================================================================== */

const getPagination = (page, size) => {
	const limit = size ? +size : 3;
	const offset = page ? page * limit : 0;
	return { limit, offset };
};

const formatPaginatedData = (fetchedData, total, page, limit) => {
	const totalItems = total;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);
	return { totalItems, data: fetchedData, totalPages, currentPage, rowPerPage: limit };
};

export const findAllPaginated = async (req, res) => {
	const {
		page = 0,
		size = 10,
		search,
		sortBy = "created_at",
		sortOrder = "DESC",
		resident_account_id,
		as_barangay_admin = false,
		likedPosts = false,
		current = false,
		specific = false,
	} = req.query;
	const { limit, offset } = getPagination(page, size);

	const fields = [
		"Posts.*",
		"PT.name as post_type_name",
		"RA.profile_image_link",
		"RA.professional_title",
		"RA.first_name",
		"RA.middle_initial",
		"RA.last_name",
		"RA.suffix",
		"RA.directory as resident_directory",
		"B.barangay_id as resident_from_barangay_id",
		"B.logo",
		"B.name",
		"B.number",
		"B.directory as barangay_directory",
		"HeartCounter.hearts_count",
		"PI.post_images",
	];

	const bind = { limit: limit, offset: offset };

	let orderByQuery = "ORDER BY Posts.created_at DESC";
	let isFavoriteQuery = "";

	//IF INTERACTING AS RESIDENT as_barangay_admin = 0, if interacting as barangay, barangay_admin = 1
	if (req.session.user?.resident_account_id) {
		fields.push("(IsFavorite.post_heart_id IS NOT NULL) as is_favorite");

		if (likedPosts) {
			isFavoriteQuery += ` INNER JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_resident_account_id AND as_barangay_admin = $as_barangay_admin) LikedPosts ON LikedPosts.post_id = Posts.post_id
			`;
			Object.assign(bind, {
				liked_by_resident_account_id: resident_account_id,
				as_barangay_admin: as_barangay_admin,
			});
			orderByQuery = "ORDER BY LikedPosts.created_at DESC";
		}

		isFavoriteQuery += ` LEFT JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_current_resident_account_id AND as_barangay_admin = $as_barangay_admin) as IsFavorite ON IsFavorite.post_id = Posts.post_id`;

		Object.assign(bind, {
			liked_by_current_resident_account_id: req.session.user?.resident_account_id,
			as_barangay_admin: as_barangay_admin,
		});
	} else {
		if (likedPosts) {
			isFavoriteQuery = ` INNER JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_resident_account_id AND as_barangay_admin = $as_barangay_admin ) as LikedPosts ON LikedPosts.post_id = Posts.post_id`;
			Object.assign(bind, {
				liked_by_resident_account_id: resident_account_id,
				as_barangay_admin: as_barangay_admin,
			});
			orderByQuery = "ORDER BY LikedPosts.created_at DESC";
		}
	}

	Object.assign(bind, {
		resident_account_id: resident_account_id,
		as_barangay_admin: as_barangay_admin,
	});

	const [results, metadata] = await db.sequelize.query(
		`SELECT ${fields.join(",")}
		FROM Posts 
		INNER JOIN ResidentAccounts RA ON RA.resident_account_id = Posts.resident_account_id
		INNER JOIN BarangayRoles BR ON BR.barangay_role_id = RA.barangay_role_id
		INNER JOIN Barangays B ON B.barangay_id = BR.barangay_id
		LEFT JOIN PostTypes PT ON PT.post_type_id = Posts.post_type_id
		LEFT JOIN (SELECT GROUP_CONCAT(image_link SEPARATOR "|") as post_images, post_id FROM PostImages GROUP BY post_id ORDER BY post_image_id ASC) as PI ON PI.post_id = Posts.post_id
		LEFT JOIN (SELECT COUNT(*) as hearts_count, post_id FROM PostHearts GROUP BY post_id) as HeartCounter ON HeartCounter.post_id = Posts.post_id
		${isFavoriteQuery}
		${
			specific
				? "WHERE Posts.resident_account_id = $resident_account_id"
				: likedPosts && req.session.user?.resident_account_id
				? "WHERE LikedPosts.resident_account_id = $resident_account_id"
				: likedPosts
				? "WHERE LikedPosts.resident_account_id = $resident_account_id"
				: ""
		}
		${orderByQuery} LIMIT $limit OFFSET $offset;`,
		{
			bind: bind,
		}
	);

	//GET TOTAL COUNT QUERY
	const [rs, md] = await db.sequelize.query(
		`SELECT COUNT(*) as totalItems
		FROM Posts 
		INNER JOIN ResidentAccounts RA ON RA.resident_account_id = Posts.resident_account_id
		INNER JOIN BarangayRoles BR ON BR.barangay_role_id = RA.barangay_role_id
		INNER JOIN Barangays B ON B.barangay_id = BR.barangay_id`
	);

	const totalItems = rs[0].totalItems;

	const response = formatPaginatedData(results, totalItems, page, limit);

	res.status(200).send(response);

	// 	where: condition,
	// 	limit,
	// 	offset,
	// 	subQuery: false,
	// 	distinct: true,
	// 	// raw: true,
	// 	// group: ["post_id"],
	// 	attributes: [
	// 		"post_id",
	// 		"resident_account_id",
	// 		"title",
	// 		"content",
	// 		"as_barangay_admin",
	// 		[db.sequelize.fn("COUNT", db.sequelize.col("hearts.post_heart_id")), "heart_counts"],
	// 		// [db.sequelize.fn("COUNT", db.sequelize.col("*")), "AAAAAAAAAAA"],
	// 		[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("Post.created_at"), "%m-%d-%Y %H:%i:%s"), "created_at"],
	// 		[db.sequelize.fn("DATE_FORMAT", db.sequelize.col("Post.updated_at"), "%m-%d-%Y %H:%i:%s"), "updated_at"],
	// 	],
	// 	include: [
	// 		{
	// 			attributes: ["professional_title", "first_name", "middle_initial", "last_name", "suffix", "directory", "barangay_role_id"],
	// 			model: ResidentAccount,
	// 			as: "resident_account",
	// 			include: {
	// 				model: BarangayRole,
	// 				attributes: ["barangay_role_id", "name", "barangay_id"],
	// 				required: true,
	// 				as: "role",
	// 				include: [
	// 					{
	// 						model: Barangay,
	// 						as: "barangay",
	// 					},
	// 				],
	// 			},
	// 		},
	// 		{
	// 			attributes: ["post_image_id", "image_link"],
	// 			model: PostImage,
	// 			as: "images",
	// 			// order: [[{ model: PostImage, as: "images" }, "post_image_id", "DESC"]],
	// 		},
	// 		{
	// 			model: PostHeart,

	// 			// INCLUDE THIS FOR LIKED POSTS OF CERTAIN USER;
	// 			// required: true,
	// 			// where: {
	// 			// 	resident_account_id: 7,
	// 			// },
	// 			//============================================
	// 			as: "hearts",
	// 		},
	// 	],
	// 	order: [
	// 		[sortBy, sortOrder],
	// 		// [{ model: PostImage, as: "images" }, "post_image_id", "ASC"],
	// 	],
	// })
	// 	.then((data) => {
	// 		const response = formatPaginatedData(data, page, limit);
	// 		res.send(response);
	// 	})
	// 	.catch((err) => {
	// 		res.status(500).send({ message: err.message || "An error occured while retrieving data" });
	// 	});
};

export const findOne = async (req, res) => {
	const { as_barangay_admin = false } = req.query;
	const post_id = req.params.post_id;

	//check if no admin_id

	try {
		const fields = [
			"Posts.*",
			"PT.name as post_type_name",
			"RA.profile_image_link",
			"RA.professional_title",
			"RA.first_name",
			"RA.middle_initial",
			"RA.last_name",
			"RA.suffix",
			"RA.directory as resident_directory",
			"B.barangay_id as resident_from_barangay_id",
			"B.logo",
			"B.name",
			"B.number",
			"B.directory as barangay_directory",
			"HeartCounter.hearts_count",
			"PI.post_images",
		];

		const bind = { post_id: post_id };

		let isFavoriteQuery = "";
		if (req.session.user?.resident_account_id) {
			//IF INTERACTING AS RESIDENT as_barangay_admin = 0, if interacting as barangay, barangay_admin = 1
			fields.push("(IsFavorite.post_heart_id IS NOT NULL) as is_favorite");
			isFavoriteQuery = `LEFT JOIN (SELECT post_id, post_heart_id FROM PostHearts WHERE resident_account_id = $resident_account_id AND as_barangay_admin = $as_barangay_admin ) as IsFavorite ON IsFavorite.post_id = Posts.post_id`;
			Object.assign(bind, {
				resident_account_id: req.session.user.resident_account_id,
				as_barangay_admin: as_barangay_admin,
			});
		}

		const [results, metadata] = await db.sequelize.query(
			`SELECT ${fields.join(",")}
			FROM Posts 
			INNER JOIN ResidentAccounts RA ON RA.resident_account_id = Posts.resident_account_id
			INNER JOIN BarangayRoles BR ON BR.barangay_role_id = RA.barangay_role_id
			INNER JOIN Barangays B ON B.barangay_id = BR.barangay_id
			LEFT JOIN PostTypes PT ON PT.post_type_id = Posts.post_type_id
			LEFT JOIN (SELECT GROUP_CONCAT(image_link SEPARATOR "|") as post_images, post_id FROM PostImages GROUP BY post_id ORDER BY post_image_id ASC) as PI ON PI.post_id = Posts.post_id
			LEFT JOIN (SELECT COUNT(*) as hearts_count, post_id FROM PostHearts GROUP BY post_id) as HeartCounter ON HeartCounter.post_id = Posts.post_id
			${isFavoriteQuery}
			WHERE Posts.post_id = $post_id`,
			{
				bind: bind,
			}
		);

		return results ? res.send(results) : res.status(404).send({ message: `Not Found` });
	} catch (error) {
		res.status(500).send({ message: `An error occured while retrieving data: ${error} ${error.stack}` });
	}
};

export const update = async (req, res) => {
	const id = req.params.id;

	const barangay = await Barangay.findByPk(id, { attributes: ["logo"] });

	const data = { ...req.body };

	let testing;

	if (req.file) {
		let form = new FormData();
		form.append("image_file", req.file.buffer, {
			filename: req.file.originalname.replace(/ /g, ""),
			contentType: req.file.mimetype,
			knownLength: req.file.size,
		});
		const { data: msg } = await axios.post(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/new`, form, {
			headers: { ...form.getHeaders() },
		});
		testing = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/barangaylogo/delete`, { params: { image_file: barangay.logo } });

		data.logo = msg.image_url;
	}

	await Barangay.update(data, { where: { barangay_id: id } });

	res.send({ message: "Data updated successfully!", data: testing?.data });
};

export const destroy = async (req, res) => {
	const id = req.params.id;

	const barangay = await Barangay.findByPk(id);

	//TODO: Check if barangay has existing residents, do not delete if it has existing residents that is not superadmin.

	Barangay.destroy({
		where: { barangay_id: id },
	})
		.then((data) => {
			res.send({ message: "Data deleted successfully!" });
		})
		.catch((err) => {
			res.status(400).send({ message: err });
		});
};

/* ========================================================================== */
/*                                 HEART POST                                 */
/* ========================================================================== */

export const heart = async (req, res) => {
	const { as_barangay_admin = false } = req.query;
	const post_id = req.params.post_id;

	try {
		const [postHeart, created] = await PostHeart.findOrCreate({
			where: {
				post_id: post_id,
				resident_account_id: req.session.user.resident_account_id,
				as_barangay_admin,
			},
		});

		postHeart.dataValues.created = created;

		res.status(201).send(postHeart);
	} catch (error) {
		res.status(400).send({ message: `Could not favorite post: ${error}`, stack: error.stack });
	}
};

export const destoryHeart = async (req, res) => {
	const { as_barangay_admin = false } = req.query;
	const post_id = req.params.post_id;

	try {
		const rows = await PostHeart.destroy({
			where: {
				post_id: post_id,
				resident_account_id: req.session.user.resident_account_id,
				as_barangay_admin,
			},
		});

		res.status(200).send({ rows });
	} catch (error) {
		res.status(400).send({ message: `Could not unfavorite post: ${error}`, stack: error.stack });
	}
};
