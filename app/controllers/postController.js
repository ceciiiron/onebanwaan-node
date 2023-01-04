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
const PostComment = db.sequelize.models.PostComment;
const Op = db.Sequelize.Op;

import axios from "axios";
import FormData from "form-data";

/* ========================================================================== */
/*                               CREATE POST                                  */
/* ========================================================================== */
export const create = async (req, res) => {
	try {
		const post = {
			resident_account_id: req.session.user.resident_account_id,
			post_type_id: req.body.post_type_id === "None" ? null : req.body.post_type_id,
			barangay_id: req.body.barangay_id == "None" ? null : req.body.barangay_id,
			title: capitalize(req.body.title?.trim() ?? "", true) || null,
			content: req.body.content?.trim() || null,
			privacy: req.body.privacy || null,
			as_barangay_admin: req.body.as_barangay_admin || false,
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

				//TODO: UPDATE TO INSERT BATCH
				message.image_urls.forEach(async (obj) => {
					await PostImage.create({
						post_id: newPost.post_id,
						image_link: obj.image_url,
					});
				});

				console.log(message.image_urls);
			} catch (error) {
				console.log(error);
				res.status(500).send({ message: `Could not upload post: ${error}`, stack: error.stack, error });
			}
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

const fields = [
	"Posts.*",
	"PT.name as post_type_name",
	"RA.profile_image_link",
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
	"CommentCounter.comments_count",
	"PI.post_images",
];

// HOMEPAGE FETCH POST
export const findAllPaginated = async (req, res) => {
	const {
		page = 0,
		size = 10,
		search,
		sortBy = "created_at",
		date_from = null,
		date_to = null,
		post_type_id,
		sortOrder = "DESC",
		resident_account_id,
		likedPosts = false,
		specific = false,
	} = req.query;
	const { limit, offset } = getPagination(page, size);
	const bind = { limit: limit, offset: offset };

	const selectedFields = [
		"Posts.*",
		"PT.name as post_type_name",
		"RA.profile_image_link",
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
		"CommentCounter.comments_count",
		"PI.post_images",
	];

	let orderByQuery = "ORDER BY Posts.created_at DESC";
	let isFavoriteQuery = "";

	if (req.session.user?.resident_account_id) {
		selectedFields.push("(IsFavorite.post_heart_id IS NOT NULL) as is_favorite");

		if (likedPosts) {
			isFavoriteQuery += ` INNER JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_resident_account_id)  LikedPosts ON LikedPosts.post_id = Posts.post_id
			`;
			Object.assign(bind, {
				liked_by_resident_account_id: resident_account_id,
			});
			orderByQuery = "ORDER BY LikedPosts.created_at DESC";
		}

		isFavoriteQuery += ` LEFT JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_current_resident_account_id) as IsFavorite ON IsFavorite.post_id = Posts.post_id`;

		Object.assign(bind, {
			liked_by_current_resident_account_id: req.session.user?.resident_account_id,
		});
	} else {
		if (likedPosts) {
			isFavoriteQuery = ` INNER JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_resident_account_id  ) as LikedPosts ON LikedPosts.post_id = Posts.post_id`;
			Object.assign(bind, {
				liked_by_resident_account_id: resident_account_id,
			});
			orderByQuery = "ORDER BY LikedPosts.created_at DESC";
		}
	}

	Object.assign(bind, {
		resident_account_id: resident_account_id,
	});

	const [results, metadata] = await db.sequelize.query(
		`SELECT ${selectedFields.join(",")}
		FROM Posts 
		INNER JOIN ResidentAccounts RA ON RA.resident_account_id = Posts.resident_account_id
		INNER JOIN BarangayRoles BR ON BR.barangay_role_id = RA.barangay_role_id
		INNER JOIN Barangays B ON B.barangay_id = BR.barangay_id
		LEFT JOIN PostTypes PT ON PT.post_type_id = Posts.post_type_id
		LEFT JOIN (SELECT GROUP_CONCAT(image_link SEPARATOR "|") as post_images, post_id FROM PostImages GROUP BY post_id ORDER BY post_image_id ASC) as PI ON PI.post_id = Posts.post_id
		LEFT JOIN (SELECT COUNT(*) as hearts_count, post_id FROM PostHearts GROUP BY post_id) as HeartCounter ON HeartCounter.post_id = Posts.post_id
		LEFT JOIN (SELECT COUNT(*) as comments_count, post_id FROM PostComments GROUP BY post_id) as CommentCounter ON CommentCounter.post_id = Posts.post_id		
		${isFavoriteQuery}
		${
			req.session.user?.resident_account_id
				? "WHERE (Posts.barangay_id IS NULL OR Posts.barangay_id = " + req.session.user.role.barangay_id + ")"
				: "WHERE Posts.barangay_id IS NULL "
		}
		${
			specific
				? "AND Posts.resident_account_id = $resident_account_id AND Posts.as_barangay_admin = 0"
				: likedPosts
				? "AND LikedPosts.resident_account_id = $resident_account_id"
				: ""
		}
		${date_from && date_to ? ` AND DATE(Posts.created_at) BETWEEN ${date_from} AND ${date_to} ` : ""}
		${post_type_id !== "ALL" || post_type_id === "undefined" ? ` AND Posts.post_type_id = ${post_type_id}  ` : ""}
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
};

export const findAllByBarangayPaginated = async (req, res) => {
	const {
		page = 0,
		size = 10,
		search,
		sortBy = "created_at",
		sortOrder = "DESC",
		resident_account_id,
		barangay_id = "",
		announcementsOnly = false,
	} = req.query;
	const { limit, offset } = getPagination(page, size);

	const bind = { limit: limit, offset: offset };

	let orderByQuery = "ORDER BY Posts.created_at DESC";
	let isFavoriteQuery = "";

	//IF INTERACTING AS RESIDENT as_barangay_admin = 0, if interacting as barangay, barangay_admin = 1
	if (req.session.user?.resident_account_id) {
		fields.push("(IsFavorite.post_heart_id IS NOT NULL) as is_favorite");

		isFavoriteQuery += ` LEFT JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_current_resident_account_id) as IsFavorite ON IsFavorite.post_id = Posts.post_id`;

		Object.assign(bind, {
			liked_by_current_resident_account_id: req.session.user?.resident_account_id,
		});
	}

	Object.assign(bind, {
		resident_account_id: resident_account_id,
		barangay_id: barangay_id,
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
		LEFT JOIN (SELECT COUNT(*) as comments_count, post_id FROM PostComments GROUP BY post_id) as CommentCounter ON CommentCounter.post_id = Posts.post_id	
		${isFavoriteQuery}
		WHERE B.barangay_id = $barangay_id AND Posts.as_barangay_admin = 1
		${announcementsOnly ? `AND (PT.name = "Announcement" OR PT.name = "Advisory")` : ""}
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
};

export const findAllPrivatePaginated = async (req, res) => {
	const { page = 0, size = 10, search, sortBy = "created_at", sortOrder = "DESC", barangay_id = "" } = req.query;
	const { limit, offset } = getPagination(page, size);

	let orderByQuery = "ORDER BY Posts.created_at DESC";
	fields.push("(IsFavorite.post_heart_id IS NOT NULL) as is_favorite");

	const [results, metadata] = await db.sequelize.query(
		`SELECT ${fields.join(",")}
		FROM Posts 
		INNER JOIN ResidentAccounts RA ON RA.resident_account_id = Posts.resident_account_id
		INNER JOIN BarangayRoles BR ON BR.barangay_role_id = RA.barangay_role_id
		INNER JOIN Barangays B ON B.barangay_id = BR.barangay_id
		LEFT JOIN PostTypes PT ON PT.post_type_id = Posts.post_type_id
		LEFT JOIN (SELECT GROUP_CONCAT(image_link SEPARATOR "|") as post_images, post_id FROM PostImages GROUP BY post_id ORDER BY post_image_id ASC) as PI ON PI.post_id = Posts.post_id
		LEFT JOIN (SELECT COUNT(*) as hearts_count, post_id FROM PostHearts GROUP BY post_id) as HeartCounter ON HeartCounter.post_id = Posts.post_id
		LEFT JOIN (SELECT COUNT(*) as comments_count, post_id FROM PostComments GROUP BY post_id) as CommentCounter ON CommentCounter.post_id = Posts.post_id			
		LEFT JOIN (SELECT post_id, post_heart_id, created_at, resident_account_id FROM PostHearts WHERE resident_account_id = $liked_by_current_resident_account_id) as IsFavorite ON IsFavorite.post_id = Posts.post_id
		WHERE Posts.barangay_id = $barangay_id
		${orderByQuery} LIMIT $limit OFFSET $offset;`,
		{
			bind: {
				limit: limit,
				offset: offset,
				barangay_id: barangay_id,
				liked_by_current_resident_account_id: req.session.user?.resident_account_id,
			},
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
	const { post_id } = req.params;

	try {
		const post = {
			resident_account_id: req.session.user.resident_account_id,
			post_type_id: req.body.post_type_id === "None" ? null : req.body.post_type_id,
			barangay_id: req.body.barangay_id == "None" ? null : req.body.barangay_id,
			title: capitalize(req.body.title?.trim() ?? "", true) || null,
			content: req.body.content?.trim() || null,
			// privacy: req.body.privacy || null,
		};
		const affectedRow = await Post.update(post, { where: { post_id } });

		res.send({ message: "Data updated successfully!", affectedRow });
	} catch (error) {
		res.status(500).send({ message: `Could not upload data: ${error}` });
	}
};

export const destroy = async (req, res) => {
	const post_id = req.params.post_id;

	const post = await Post.findByPk(post_id, {
		include: [
			{
				model: PostImage,
				attributes: ["image_link"],
				as: "images",
			},
			{
				model: ResidentAccount,
				as: "resident_account",
				include: {
					model: BarangayRole,
					as: "role",
					include: {
						model: Barangay,
						as: "barangay",
					},
				},
			},
		],
	});

	if (!post) {
		res.status(404).send({ message: "Not found" });
	}

	if (post?.images.length > 0) {
		try {
			let form = new FormData();
			let imageUrlsArray = [];
			post.images.forEach((image) => {
				imageUrlsArray.push(image.image_link);
			});
			let params = "?";
			for (let imageUrlIndex in imageUrlsArray) {
				params += `${imageUrlIndex != 0 ? "&" : ""}image_files[]=${imageUrlsArray[imageUrlIndex]}`;
			}
			params += "&image_type=post";
			params += "&directory=" + post.resident_account.role.barangay.directory;
			params += "&sub_directory=" + post.resident_account.directory;

			const { data: deleteImageMessage } = await axios.delete(`${process.env.IMAGE_HANDLER_URL}/onebanwaan/upload/delete` + params, {
				headers: { ...form.getHeaders() },
			});
			console.log("DELTED FILES", deleteImageMessage);
			console.log("PARAMS", params);
		} catch (error) {
			console.log(error);
			res.status(500).send({ message: error });
		}
	}

	try {
		const data = await Post.destroy({
			where: { post_id },
		});
		res.send({ message: "Data deleted successfully!", data });
	} catch (error) {
		res.status(500).send({ message: error });
	}
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

export const likes = async (req, res) => {
	const post_id = req.params.post_id;

	try {
		const rows = await PostHeart.findAll({
			where: {
				post_id: post_id,
			},
			include: {
				model: ResidentAccount,
				as: "resident_heart",
				include: [
					{
						model: BarangayRole,
						required: true,
						as: "role",
						attributes: ["barangay_role_id", "name"],
						include: [
							{
								model: Barangay,
								required: true,
								as: "barangay",
								attributes: ["barangay_id", "name", "logo", "number", "directory"],
							},
						],
					},
				],
			},
		});

		res.status(200).send({ rows });
	} catch (error) {
		res.status(404).send({ message: `Not found: ${error}`, stack: error.stack });
	}
};
