import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayGalleryImage extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			models.BarangayGallery.hasMany(models.BarangayGalleryImage, {
				foreignKey: "barangay_gallery_id",
				as: "main_gallery",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayGalleryImage.belongsTo(models.BarangayGallery, {
				foreignKey: "barangay_gallery_id",
				as: "barangay_gallery_image",
			});
		}
	}

	BarangayGalleryImage.init(
		{
			barangay_gallery_image_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			link: { type: DataTypes.STRING(500), allowNull: false },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: false,
			modelName: "BarangayGalleryImage",
		}
	);

	return BarangayGalleryImage;
};
