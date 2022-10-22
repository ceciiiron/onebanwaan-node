import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class PostImage extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			/* --------------------- PostType 1:M Post --------------------- */
			models.Post.hasMany(models.PostImage, {
				foreignKey: "post_id",
				as: "images",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.PostImage.belongsTo(models.Post, {
				foreignKey: "post_id",
				as: "origin_post",
			});
		}
	}

	PostImage.init(
		{
			post_image_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			post_id: { type: DataTypes.INTEGER, allowNull: false },
			image_link: { type: DataTypes.STRING(500) },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: false,
			modelName: "PostImage",
		}
	);

	return PostImage;
};
