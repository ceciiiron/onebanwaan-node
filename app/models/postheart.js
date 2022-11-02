import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class PostHeart extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			/* --------------------- PostHearts 1:M Post --------------------- */
			models.Post.hasMany(models.PostHeart, {
				foreignKey: "post_id",
				as: "hearts",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.PostHeart.belongsTo(models.Post, {
				foreignKey: "post_id",
				as: "origin_post",
			});

			/* --------------------- Resident 1:M PostHeart --------------------- */
			models.ResidentAccount.hasMany(models.PostHeart, {
				foreignKey: "resident_account_id",
				as: "resident_hearts",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.PostHeart.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				as: "resident_heart",
			});
		}
	}

	PostHeart.init(
		{
			post_heart_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			post_id: { type: DataTypes.INTEGER, allowNull: false },
			resident_account_id: { type: DataTypes.INTEGER, allowNull: false },
			// image_link: { type: DataTypes.STRING(500) },
			as_barangay_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: false,
			modelName: "PostHeart",
		}
	);

	return PostHeart;
};
