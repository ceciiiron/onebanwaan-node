import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class Post extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			/* --------------------- PostType 1:M Post --------------------- */
			models.PostType.hasMany(models.Post, {
				foreignKey: "post_type_id",
				as: "posts",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.Post.belongsTo(models.PostType, {
				foreignKey: "post_type_id",
				as: "post_type",
			});

			/* --------------------- Resident 1:M Post --------------------- */
			models.ResidentAccount.hasMany(models.Post, {
				foreignKey: "resident_account_id",
				as: "resident_account_posts",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.Post.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				as: "post",
			});

			/* --------------------- Barangay 1:M Post --------------------- */
			models.Barangay.hasMany(models.Post, {
				foreignKey: "barangay_id",
				as: "barangay_posts",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.Post.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "posted_to_barangay",
			});
		}
	}

	Post.init(
		{
			post_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			resident_account_id: { type: DataTypes.INTEGER },
			post_type_id: { type: DataTypes.INTEGER, allowNull: true },
			barangay_id: { type: DataTypes.INTEGER, allowNull: true },
			title: { type: DataTypes.STRING },
			content: { type: DataTypes.STRING },
			privacy: { type: DataTypes.BOOLEAN, defaultValue: false },
			as_barangay_admin: { type: DataTypes.BOOLEAN, defaultValue: false }, //paglumipat sya brgy, set all posts to barangay_admin = false where resident_id = ?
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "Post",
		}
	);

	return Post;
};
