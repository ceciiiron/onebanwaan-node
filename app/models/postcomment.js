import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class PostComment extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			/* --------------------- PostComments 1:M Post --------------------- */
			models.Post.hasMany(models.PostComment, {
				foreignKey: "post_id",
				as: "comments",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.PostComment.belongsTo(models.Post, {
				foreignKey: "post_id",
				as: "origin_post",
			});

			/* --------------------- Resident 1:M PostComment --------------------- */
			models.ResidentAccount.hasMany(models.PostComment, {
				foreignKey: "resident_account_id",
				as: "resident_comments",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.PostComment.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				as: "resident_comment",
			});
		}
	}

	PostComment.init(
		{
			post_comment_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			post_id: { type: DataTypes.INTEGER, allowNull: false },
			resident_account_id: { type: DataTypes.INTEGER, allowNull: false },
			// image_link: { type: DataTypes.STRING(500) },
			as_barangay_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
			content: { type: DataTypes.STRING(500) },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "PostComment",
		}
	);

	return PostComment;
};
